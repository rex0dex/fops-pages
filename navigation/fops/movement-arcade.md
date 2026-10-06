---
layout: fops
title: Movement Arcade
lede: Games you play by moving. Steer a balloon with gentle nods, or pop bubbles with your finger.
permalink: /movement/arcade/
---

<section class="section">
  <div class="container">
    <div id="arcade-app" class="game">

      <div data-screen="pick">
        <h2 class="game-prompt">Choose a game</h2>
        <div class="choice-grid">
          <button class="choice" type="button" data-game="balloon">
            <span class="choice-icon" aria-hidden="true">🎈</span>
            <span class="choice-title">Balloon Ride</span>
            <span class="choice-text">Nod gently down and up to fly a hot-air balloon. Collect stars and float around the clouds.</span>
          </button>
          <button class="choice" type="button" data-game="bubbles">
            <span class="choice-icon" aria-hidden="true">🫧</span>
            <span class="choice-title">Bubble Pop</span>
            <span class="choice-text">Hold up one hand and point. Touch the floating bubbles with your fingertip to pop them.</span>
          </button>
        </div>
        <p class="game-weak" data-best></p>
      </div>

      <div data-screen="privacy" hidden>
        <h2 class="game-prompt">Before we turn on your camera</h2>
        <ul class="checklist">
          <li><strong>Your video stays on this computer.</strong> It is not recorded, uploaded, or sent anywhere.</li>
          <li><strong>Stay seated</strong> in a steady chair, about an arm's length from the screen.</li>
          <li><strong>Move slowly</strong> and only as far as is comfortable. There is no way to lose.</li>
          <li>Press the big <strong>Stop</strong> button at any time.</li>
        </ul>
        <div class="btn-row" style="margin-top:1.25rem">
          <button class="btn btn-primary btn-lg" type="button" data-action="camera">Turn On Camera</button>
          <button class="btn btn-outline" type="button" data-action="back">Back</button>
        </div>
        <p class="form-message" data-camera-message role="status" aria-live="polite"></p>
      </div>

      <div data-screen="play" hidden>
        <p class="move-coach" data-coach aria-live="polite">Getting ready…</p>
        <div class="move-meter" aria-hidden="true"><div class="move-meter-fill" data-meter></div></div>
        <div class="arcade-stage">
          <canvas data-canvas width="960" height="720" aria-label="Game screen"></canvas>
          <video data-video playsinline muted aria-hidden="true"></video>
        </div>
        <div class="btn-row" style="margin-top:1rem">
          <button class="btn btn-outline" type="button" data-action="sound" aria-pressed="true">Sound: On</button>
        </div>
        <button class="btn btn-donate btn-lg move-stop" type="button" data-action="stop">Stop</button>
      </div>

      <div data-screen="done" hidden>
        <h2 class="game-prompt" data-done-title>Well done!</h2>
        <ul class="facts" data-summary></ul>
        <div class="btn-row" style="margin-top:1.25rem">
          <button class="btn btn-primary btn-lg" type="button" data-action="again">Play Again</button>
          <button class="btn btn-outline" type="button" data-action="back">Choose Another</button>
        </div>
      </div>

    </div>
    <noscript><p class="callout">These games need JavaScript turned on in your browser.</p></noscript>
  </div>
</section>

<script type="module" src="{{ '/assets/js/fops/movement/arcade-play.js' | relative_url }}"></script>
