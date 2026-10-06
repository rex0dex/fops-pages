---
layout: fops
title: Movement Games
lede: Gentle seated exercises, counted for you by your webcam. Stay seated, and stop any time.
permalink: /movement/play/
---

<section class="section">
  <div class="container">
    <div id="move-app" class="game">

      <!-- Choose a game -->
      <div data-screen="pick">
        <h2 class="game-prompt">Choose an exercise</h2>
        <div class="choice-grid">
          <button class="choice" type="button" data-game="nod">
            <span class="choice-icon" aria-hidden="true">🙂</span>
            <span class="choice-title">Head Nod</span>
            <span class="choice-text">Slowly nod your chin down, then back up.</span>
          </button>
          <button class="choice" type="button" data-game="turn">
            <span class="choice-icon" aria-hidden="true">↔️</span>
            <span class="choice-title">Head Turn</span>
            <span class="choice-text">Slowly turn to look left, back to the middle, then right.</span>
          </button>
          <button class="choice" type="button" data-game="reach">
            <span class="choice-icon" aria-hidden="true">✋</span>
            <span class="choice-title">Reach and Tap</span>
            <span class="choice-text">Reach a hand toward the circles on the screen and hold.</span>
          </button>
        </div>
        <div class="bingo-options">
          <label for="move-goal">How many</label>
          <select id="move-goal" data-goal>
            <option value="5">5 times</option>
            <option value="10" selected>10 times</option>
            <option value="15">15 times</option>
          </select>
          <label for="move-size">How big a movement</label>
          <select id="move-size" data-size>
            <option value="0.7">Gentle</option>
            <option value="1" selected>Normal</option>
            <option value="1.3">Bigger</option>
          </select>
        </div>
        <p class="game-weak" data-history></p>
      </div>

      <!-- Privacy, before the camera turns on -->
      <div data-screen="privacy" hidden>
        <h2 class="game-prompt">Before we turn on your camera</h2>
        <ul class="checklist">
          <li><strong>Your video stays on this computer.</strong> It is not recorded, uploaded, or sent anywhere.</li>
          <li><strong>Stay seated</strong> in a steady chair, about an arm's length from the screen.</li>
          <li><strong>Move slowly</strong> and only as far as is comfortable.</li>
          <li>Press the big <strong>Stop</strong> button at any time.</li>
        </ul>
        <div class="btn-row" style="margin-top:1.25rem">
          <button class="btn btn-primary btn-lg" type="button" data-action="camera">Turn On Camera</button>
          <button class="btn btn-outline" type="button" data-action="back">Back</button>
        </div>
        <p class="form-message" data-camera-message role="status" aria-live="polite"></p>
      </div>

      <!-- The exercise -->
      <div data-screen="session" hidden>
        <div class="move-top">
          <div>
            <p class="lesson-kicker" data-game-name></p>
            <p class="move-count" data-count aria-live="polite">0 of 10</p>
          </div>
          <button class="btn btn-donate btn-lg move-stop" type="button" data-action="stop">Stop</button>
        </div>
        <p class="move-coach" data-coach aria-live="polite">Getting ready…</p>
        <div class="move-meter" aria-hidden="true"><div class="move-meter-fill" data-meter></div></div>
        <div class="move-stage">
          <video data-video playsinline muted></video>
          <canvas data-canvas></canvas>
        </div>
        <div class="btn-row" style="margin-top:1rem">
          <button class="btn btn-outline" type="button" data-action="voice" aria-pressed="true">Voice: On</button>
        </div>
      </div>

      <!-- Results -->
      <div data-screen="done" hidden>
        <h2 class="game-prompt" data-done-title>Well done!</h2>
        <ul class="facts" data-summary></ul>
        <div class="btn-row" style="margin-top:1.25rem">
          <button class="btn btn-primary btn-lg" type="button" data-action="again">Do It Again</button>
          <button class="btn btn-outline" type="button" data-action="back">Choose Another</button>
        </div>
      </div>

    </div>
    <noscript><p class="callout">Movement games need JavaScript turned on in your browser.</p></noscript>
  </div>
</section>

<script type="module" src="{{ '/assets/js/fops/movement/games.js' | relative_url }}"></script>
