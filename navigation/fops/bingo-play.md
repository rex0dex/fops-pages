---
layout: fops
title: Play Bingo
lede: Large-print Bingo with a speaking caller. Play by yourself, or with friends using a game number.
permalink: /bingo/play/
---

<section class="section">
  <div class="container">
    <div id="bingo-app" class="game">

      <!-- Choose how to play -->
      <div data-screen="lobby">
        <h2 class="game-prompt">How would you like to play?</h2>
        <div class="choice-grid">
          <button class="choice" type="button" data-action="solo">
            <span class="choice-icon" aria-hidden="true">🎱</span>
            <span class="choice-title">Play by Myself</span>
            <span class="choice-text">The computer calls the numbers. You can pause any time.</span>
          </button>
          <button class="choice" type="button" data-action="host">
            <span class="choice-icon" aria-hidden="true">👥</span>
            <span class="choice-title">Start a Game with Friends</span>
            <span class="choice-text">Get a game number to share. Everyone hears the same calls.</span>
          </button>
          <button class="choice" type="button" data-action="show-join">
            <span class="choice-icon" aria-hidden="true">🔢</span>
            <span class="choice-title">Join a Friend's Game</span>
            <span class="choice-text">Type in the 4-digit game number a friend gave you.</span>
          </button>
        </div>

        <div class="bingo-options">
          <label for="bingo-speed">Time between numbers</label>
          <select id="bingo-speed" data-speed>
            <option value="12">Slow (12 seconds)</option>
            <option value="10" selected>Relaxed (10 seconds)</option>
            <option value="8">Medium (8 seconds)</option>
            <option value="6">Quick (6 seconds)</option>
          </select>
        </div>

        <form class="bingo-join" data-join-form hidden>
          <div class="field">
            <label for="bingo-code">Game number</label>
            <input id="bingo-code" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" placeholder="1234">
          </div>
          <button class="btn btn-primary btn-lg" type="submit">Join Game</button>
        </form>

        <p class="form-message" data-lobby-message role="status" aria-live="polite"></p>
        <div data-signin-needed hidden class="callout">
          <p>Playing with friends needs an account, so the game knows whose card is whose.</p>
          <a class="btn btn-primary" href="{{ '/signin/' | relative_url }}">Sign In or Create Account</a>
        </div>
        <p class="game-weak" data-stats></p>
      </div>

      <!-- Waiting room for friends games -->
      <div data-screen="waiting" hidden>
        <p class="lesson-kicker">Your game number is</p>
        <p class="room-code" data-room-code>0000</p>
        <p>Tell your friends this number. They choose <strong>Join a Friend's Game</strong> and type it in.</p>
        <h3>Players</h3>
        <ul class="checklist" data-players></ul>
        <div class="btn-row" style="margin-top:1rem">
          <button class="btn btn-primary btn-lg" type="button" data-action="start" hidden>Everyone's Here: Start</button>
          <button class="btn btn-outline" type="button" data-action="leave">Leave</button>
        </div>
        <p class="game-weak" data-waiting-note></p>
      </div>

      <!-- The game -->
      <div data-screen="game" hidden>
        <div class="bingo-layout">
          <div class="bingo-caller">
            <p class="lesson-kicker" data-caller-label>Current number</p>
            <canvas class="cage" data-cage width="420" height="340" aria-hidden="true"></canvas>
            <p class="ball-text" data-ball aria-live="assertive" aria-atomic="true">–</p>
            <p class="ball-count" data-count>0 of 75 called</p>
            <p class="lesson-kicker">Recent numbers</p>
            <ol class="recent" data-recent></ol>
            <div class="bingo-controls">
              <button class="btn btn-outline" type="button" data-action="pause">Pause</button>
              <button class="btn btn-outline" type="button" data-action="voice" aria-pressed="true">Voice: On</button>
              <button class="btn btn-outline" type="button" data-action="automark" aria-pressed="true">Auto-mark: On</button>
              <button class="btn btn-outline" type="button" data-action="quit">End Game</button>
            </div>
          </div>
          <div class="bingo-board">
            <div class="bingo-card" data-card role="grid" aria-label="Your Bingo card"></div>
            <button class="btn btn-donate btn-lg bingo-call" type="button" data-action="bingo">BINGO!</button>
            <div class="game-feedback" data-game-message aria-live="polite"></div>
          </div>
        </div>
      </div>

    </div>
    <noscript><p class="callout">Bingo needs JavaScript turned on in your browser.</p></noscript>
  </div>
</section>

<script type="module" src="{{ '/assets/js/fops/bingo/play.js' | relative_url }}"></script>
