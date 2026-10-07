---
layout: fops
title: Head Nod
lede: A gentle seated exercise. Nod your head down and up, and your webcam counts each one for you.
permalink: /movement/play/
---

<section class="section">
  <div class="container">
    <div id="nod-app" class="game">

      <!-- Before the camera turns on -->
      <div data-screen="start">
        <h2 class="game-prompt">Head Nod: 10 nods</h2>
        <ul class="checklist">
          <li><strong>Your video stays on this computer.</strong> It is not recorded, uploaded, or sent anywhere.</li>
          <li><strong>Stay seated</strong> in a steady chair, about an arm's length from the screen.</li>
          <li><strong>Nod slowly</strong>: chin down, then back up. Only go as far as is comfortable.</li>
          <li>Press the big <strong>Stop</strong> button at any time.</li>
        </ul>
        <p style="margin-top:1.25rem">
          <button class="btn btn-primary btn-lg" type="button" data-action="camera">Turn On Camera</button>
        </p>
        <p class="form-message" data-camera-message role="status" aria-live="polite"></p>
      </div>

      <!-- The exercise -->
      <div data-screen="session" hidden>
        <p class="move-count" data-count aria-live="polite">0 of 10</p>
        <p class="move-coach" data-coach aria-live="polite">Getting ready…</p>
        <div class="move-meter" aria-hidden="true"><div class="move-meter-fill" data-meter></div></div>
        <div class="move-stage">
          <video data-video playsinline muted></video>
        </div>
        <button class="btn btn-donate btn-lg move-stop" type="button" data-action="stop">Stop</button>
      </div>

      <!-- Finished -->
      <div data-screen="done" hidden>
        <h2 class="game-prompt" data-done-title>Well done!</h2>
        <p data-summary></p>
        <div class="btn-row" style="margin-top:1.25rem">
          <button class="btn btn-primary btn-lg" type="button" data-action="again">Do It Again</button>
        </div>
      </div>

    </div>
    <noscript><p class="callout">This exercise needs JavaScript turned on in your browser.</p></noscript>
  </div>
</section>

<script type="module" src="{{ '/assets/js/fops/movement/nod.js' | relative_url }}"></script>
