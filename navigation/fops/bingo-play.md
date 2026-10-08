---
layout: fops
title: Play Bingo
lede: Large-print Bingo with a speaking caller. The computer calls the numbers, and you can pause any time.
permalink: /bingo/play/
---

<section class="section">
  <div class="container">
    <div id="bingo-app" class="game">

      <!-- Start screen -->
      <div data-screen="lobby">
        <h2 class="game-prompt">Ready to play?</h2>
        <div class="bingo-options">
          <label for="bingo-speed">Time between numbers</label>
          <select id="bingo-speed" data-speed>
            <option value="12">Slow (12 seconds)</option>
            <option value="10" selected>Relaxed (10 seconds)</option>
            <option value="8">Medium (8 seconds)</option>
            <option value="6">Quick (6 seconds)</option>
          </select>
        </div>
        <p style="margin-top:1.25rem">
          <button class="btn btn-primary btn-lg" type="button" data-action="solo">Start Bingo</button>
        </p>
        <p class="game-weak" data-stats></p>
      </div>

      <!-- The game -->
      <div data-screen="game" hidden>
        <div class="bingo-layout">
          <div class="bingo-caller">
            <p class="lesson-kicker">Current number</p>
            <div class="ball" data-ball aria-live="assertive" aria-atomic="true">–</div>
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
