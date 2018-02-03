import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import { Game } from 'boardgame.io/core'
import { Client } from 'boardgame.io/client'
import { TurnOrder } from 'boardgame.io/core';

const cardStyle = {
  display: 'block',
  width: '300px',
  height: '450px',
  background: '#ffffff',
  position: 'absolute',
  borderRadius: '10px',
  border: 'solid 4px #111111',
}

const cardBodyStyle = {};

const cardTimerStyle = {};

const cardWordStyle = {
  color: 'red'
};

const cardButtons = {
  accept: {},
  decline: {}
}

class Card extends Component {
  render() {
    return <div style={cardStyle}>
      <div style={cardBodyStyle}>
        {this.props.cardBody}
      </div>
    </div>
  }
}

class CardTimer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      seconds: props.time,
      active: props.timerIsActive || false
    }
  }
  render() { return <p style={cardTimerStyle}>{this.state.seconds}</p> }
  componentDidMount() {
    let self = this;
    this.timerId = setInterval(
      () => {
        this.setState(prevState => {
          let timeIsOut = prevState.seconds < 1;
          if (timeIsOut) { clearInterval(self.timerId); this.props.onTimeOut()}
          return {
            seconds: (!timeIsOut && prevState.active) ? prevState.seconds - 1:prevState.seconds,
            active: !timeIsOut && this.props.timerIsActive
          }
        })
      }, 1000
    )
  }
}

class WordToDiscribe extends Component {
  render() { return <p style={cardWordStyle}>{this.props.wordToDisribe}</p> }
}

class AcceptOrDeclineButtons extends Component {
  render() {
    return <React.Fragment>
      <button onClick={this.props.onAccept}>Accept</button>
      <button onClick={this.props.onDecline}>Decline</button>
    </React.Fragment>
  }
}

class WordCard extends Component {
  render() {
    // const { error, isLoaded, wordToDisribe } = this.state;
    return <Card cardBody={
      <React.Fragment>
        <CardTimer
          time={this.props.timeToDescribe}
          timerIsActive={this.props.timerIsActive}
          onTimeOut={this.props.onTimeOut}
        />
        <hr></hr>
        <WordToDiscribe wordToDisribe={this.props.wordToDisribe} />
        <hr></hr>
        <AcceptOrDeclineButtons
          onAccept={this.props.onSuccessDescribe}
          onDecline={this.props.onFailedDescribe}
        />
        <hr></hr>
        {this.props.winner}
      </React.Fragment>
    } />
  }
}

class ChooseThemeCard extends Component { }

class SimilarWordsGameBoard extends Component {

  constructor(props) {
    super(props);
    this.state = {
      error: this.props.G.error || null,
      isLoaded: this.props.G.isLoaded,
      wordsToDescribe: []
    }

    this.onDescribeWord = this.onDescribeWord.bind(this);
    this.onSuccessDescribeWord = this.onSuccessDescribeWord.bind(this);
    this.onFailedDescribeWord = this.onFailedDescribeWord.bind(this);
  }

  onDescribeWord = (isSuccess) => {
    this.setState((prevState)=>{
      return {...prevState, ...rotateWordToDescribe(prevState.wordsToDescribe)};
    })
    if(isSuccess) {
      this.props.moves.successDescribeWord()
    }
  }

  onSuccessDescribeWord(){
    this.onDescribeWord(true)
  };
  onFailedDescribeWord(){
    this.onDescribeWord(false)
  };

  render() {
    let content = <React.Fragment>
      <h1>DiscribeWordBoard</h1>
      {{
        'choose theme': (
          <React.Fragment>
            <form>
              <fieldset>
                <legend>
                choose theme
                  </legend>
                  <input type="radio" onChange={this.props.moves.chooseTheme} id="firstTheme" name="firstTheme"
                  value="most intresting that others" />
                  <label htmlFor="firstTheme">first theme</label>
                  <input type="radio" onChange={this.props.moves.chooseTheme} id="secondTheme" name="secondTheme"
                  value="another intresting that others" />
                  <label htmlFor="secondTheme">second theme</label>
              </fieldset>
              </form>
          <p></p>
          </React.Fragment>
        ),
        'accept ready for describe the word': (
          <React.Fragment>
          <p>are you ready to describe?</p>
          <hr></hr>
          <AcceptOrDeclineButtons
            onAccept={this.props.moves.readyToDesctibe}
          />
          <hr></hr>
          </React.Fragment>
        ),
        'describe the word': (
          <WordCard
            wordToDisribe={this.state.wordToDescribe}
            onSuccessDescribe={this.onSuccessDescribeWord}
            onFailedDescribe={this.onFailedDescribeWord}
            onReadyToDescribe={this.props.moves.readyToDesctibe}
            onTimeOut={()=>{
              this.props.events.endPhase();
              this.props.events.endTurn();
            }}
            onChooseTheTheme={null}
            timeToDescribe={this.props.G.timeToDescribe}
            timerIsActive={this.props.G.timerIsActive}
            winner={this.props.ctx.gameover}
          />
        )
      }[this.props.ctx.phase]}

    </React.Fragment>;
    let loading = <p style={{ color: 'red' }}>{this.state.error || "Wait for load"}</p>
    return !this.state.isLoaded ? loading : content;
  }
  componentDidMount() {
    if (this.state.wordsToDescribe.length === 0) {
      fetch('http://1.lobarev.com/api/dictionary/en_easy')
      .then(res => res.json())
      .then(
      words => {
        this.setState(prevState => {
          let wordsToDescribe = words;
          let wordToDescribe = wordsToDescribe.pop();
          return { ...prevState, isLoaded: true, wordToDescribe, wordsToDescribe }
        })
      },
      error => {
        this.setState({
          isLoaded: true,
          error
        })
      }
      )
    } else {
      this.setState(prevState=>{
        let wordsToDescribe = [...prevState.wordsToDescribe];
        let wordToDescribe = wordsToDescribe.pop();
        return { ...prevState, isLoaded: true, wordToDescribe, wordsToDescribe }
      })
    }
  }
}

function rotateWordToDescribe(words){
  let wordsToDescribe = [...words];
  let wordToDescribe = wordsToDescribe.pop();
  return {wordsToDescribe, wordToDescribe};
}

const SimilarWordsGame = Game({
  setup: (playerNumbers) => ({
    theme: '',
    timeIsOut: false,
    timerIsActive: false,
    timeToDescribe: 10,
    pointsLimit: 10,
    playerIsReadyToDesctibe: false,
    gameProgress: Array(playerNumbers).fill({}).map((item, index) => {
      return { gamePoints: 0 }
    }),
  }),
  moves: {

    chooseTheme: (G, ctx, action) => {
      action.preventDefault();
      return { ...G, theme: action.target.value }
    },
    readyToDesctibe: G => {
      return {
        ...G, playerIsReadyToDesctibe: true, timerIsActive: true, timeoutSeconds: 60
      }
    },
    successDescribeWord: (G, ctx) => {
      let gameContext = { ...G };
      gameContext.gameProgress[ctx.currentPlayer] = { ...gameContext.gameProgress[ctx.currentPlayer], gamePoints: +G.gameProgress[ctx.currentPlayer].gamePoints + 1 }
      return gameContext;
    },
    pause: G => {
      return { ...G, timerIsActive: !G.timerIsActive }},
  },
  flow: {
    triggers: [
      {
        condition: (G, ctx) => {
          return G.gameProgress[ctx.currentPlayer].gamePoints >= G.pointsLimit+2
        },
        action: (G, ctx) => {
          ctx.events.endGame();
          return {...G}
        },
      }
    ],
    phases: [
      {
        name: 'choose theme',
        endPhaseIf: (G, ctx) => {
          return G.theme && G.theme.length !== 0
        },
        allowedMoves: ['chooseTheme'],
        TurnOrder: TurnOrder.ANY,
      },
      {
        name: 'accept ready for describe the word',
        endPhaseIf: (G, ctx) => G.playerIsReadyToDesctibe,
        allowedMoves: ['readyToDesctibe', 'pause'],
        TurnOrder: TurnOrder.DEFAULT.next,
      },
      {
        name: 'describe the word',
        onPhaseBegin: (G, ctx) => ({ ...G, timeoutSeconds: 60, }),
        onPhaseEnd: (G, ctx) => {
          return { ...G }
        },
        endGameIf: (G, ctx) => {
          if (G.gameProgress[ctx.currentPlayer].gamePoints === G.pointsLimit) {
            return `winner ${ctx.currentPlayer} player`
          }
        },
        allowedMoves: ['successDescribeWord', 'failedDescribeWord', 'pause'],
        TurnOrder: TurnOrder.DEFAULT,
      },
    ]
  }
})

const App = Client({
  numPlayers: 2,
  game: SimilarWordsGame,
  board: SimilarWordsGameBoard
})

export default App;
