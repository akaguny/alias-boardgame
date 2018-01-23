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
      seconds: null,
      active: false,
      initValue: null
    }
  }
  render() { return <p style={cardTimerStyle}>{this.state.seconds}</p> }
  componentDidMount() {
    let self = this;
    this.timerId = setInterval(
      () => {
        this.setState(prevState => {
          let timeIsOut = prevState.seconds < 1;
          if (timeIsOut) { clearInterval(self.timerId) }
          return {
            seconds: !timeIsOut && prevState.seconds - 1,
            active: !timeIsOut
          }
        })
      }, 1000
    )
  }
}

class WordToDiscribe extends Component {
  render() { return <p style={cardWordStyle}>{this.props.wordToDisribe}</p> }
}

class CardDescribeResultButtons extends Component {
  render() {
    return <React.Fragment>
      <p>{this.props.agreement}</p>
      <button onClick={this.props.onAccept}>Accept</button>
      <button onClick={this.props.onDecline}>Decline</button>
    </React.Fragment>
  }
}

class WordCard extends Component {
  // constructor(props) {
  //   super(props);
  // }

  // componentWillMount() {

  // }

  render() {
    // const { error, isLoaded, wordToDisribe } = this.state;
    return <Card cardBody={
      <React.Fragment>
        <CardTimer
          time={this.props.timeToDescribe}
          timerIsActive={this.props.timerIsActive}
        />
        <hr></hr>
        <WordToDiscribe wordToDisribe={this.props.wordToDisribe} />
        <hr></hr>
        <CardDescribeResultButtons
          onAccept={this.props.onSuccessDescribe}
          onDecline={this.props.onFailedDescribe}
        />
      </React.Fragment>
    } />
  }
}

class ChooseThemeCard extends Component { }


class SimilarWordsGameBoard extends Component {

  constructor(props) {
    super(props);
    this.state = {
      error: null,
      isLoaded: false,
      wordsToDescribe: [...this.props.G.wordToDescribe]
    }
  }

  render() {
    let content = <React.Fragment>
      <h1>DiscribeWordBoard</h1>
      {{
        'choose theme': (
          <p></p>
        ),
        'accept ready for describe the word': (
          <p></p>
        ),
        'describe the word': (
          <WordCard
            wordToDisribe={this.state.wordToDescribe}
            onSuccessDescribe={this.props.moves.successDescribeWord}
            onFailedDescribe={this.props.moves.failedDescribeWord}
            onReadyToDescribe={this.props.moves.readyToDesctibe}
            onChooseTheTheme={null}
            timeToDescribe={this.props.G.timeToDescribe}
            timerIsActive={this.props.G.timerIsActive}
          />
        )
      }[this.props.ctx.phase]}

    </React.Fragment>;
    let loading = <p style={{ color: 'red' }}>{this.state.error || "Wait for load"}</p>
    return !this.state.isLoaded || this.state.error ? loading : content;
  }

  componentDidMount() {
    if (this.state.wordsToDescribe.length === 0) {
      fetch('http://1.lobarev.com/api/dictionary/en_easy')
      .then(res => res.json())
      .then(
      words => {
        console.log();
        this.setState(prevState => ({ ...prevState, wordsToDescribe: words }))
        this.setState(prevState => ({ ...prevState, isLoaded: true, wordToDescribe: prevState.wordsToDescribe.pop(), wordsToDescribe: words }))
      },
      error => {
        this.setState({
          isLoaded: true,
          error
        })
      }
      )
    } else {
      this.setState(prevState => ({ ...prevState, wordToDescribe: prevState.wordsToDescribe.pop() }))
    }
  }
}

const SimilarWordsGame = Game({
  setup: (playerNumbers) => ({
    theme: '',
    timeoutSeconds: 60,
    timeIsOut: false,
    timerIsActive: false,
    timeToDescribe: 0,
    pointsLimit: 100,
    wordsToDescribe: [],
    wordToDescribe: '',
    playerIsReadyToDesctibe: false,
    gameProgress: Array(playerNumbers).fill({}).map((item, index) => {
      return { gamePoints: 0 }
    }),
  }),
  moves: {

    chooseTheme: (G, ctx) => {
      return { ...G, theme: 'most intresting that others' }
    },
    readyToDesctibe: G => {
      let gameContext = { ...G };
      return {
        ...G, wordToDescribe: gameContext.wordsToDescribe.pop(),
        playerIsReadyToDesctibe: true, timerIsActive: true, timeoutSeconds: 60
      }
    },
    successDescribeWord: (G, ctx) => {
      let gameContext = { ...G };
      gameContext.gameProgress[ctx.currentPlayer] = { ...gameContext.gameProgress[ctx.currentPlayer], gamePoints: +G.gameProgress[ctx.currentPlayer].gamePoints + 1 }
      gameContext = { ...G, wordToDescribe: gameContext.wordsToDescribe.pop() }
      return gameContext;
    },
    failedDescribeWord: G => {
      let gameContext = { ...G };
      return { ...G, wordToDescribe: gameContext.wordsToDescribe.pop() }
    },
    pause: G => ({ ...G, timerIsActive: false }),
  },
  flow: {
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
        TurnOrder: TurnOrder.SKIP,
      },
      {
        name: 'describe the word',
        onPhaseBegin: (G, ctx) => ({ ...G, timeoutSeconds: 60, }),
        endTurnIf: (G, ctx) => G.timeIsOut,
        endPhaseIf: (G, ctx) => G.timeIsOut,
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
