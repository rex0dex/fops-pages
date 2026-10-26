---
layout: post
title: Size It Up
description: A geography game. Make a place the right size next to another one. Every shape and size comes from real maps.
permalink: /geography/
toc: false
comments: false
show_reading_time: false
---



<div id="geo-app" class="fops-game ocs__card">

      <!-- Start -->
      <div data-screen="start">
        <h2 class="game-prompt">How big is it really?</h2>
        <p>Each round shows a place drawn <strong>to scale</strong> and a second place at the wrong size. Resize the second place until you think it is the right size compared with the first. Whoever is closest to the real size wins the round. Best of 5 rounds wins.</p>
        <div class="game-options">
          <label for="geo-mode">Play against</label>
          <select id="geo-mode" data-mode>
            <option value="easy">Bot (easy)</option>
            <option value="medium" selected>Bot (medium)</option>
            <option value="hard">Bot (hard)</option>
            <option value="friend">A friend on this device</option>
          </select>
          <label for="geo-region">Places</label>
          <select id="geo-region" data-region>
            <option value="both" selected>Countries and US states</option>
            <option value="world">Countries only</option>
            <option value="us">US states only</option>
          </select>
        </div>
        <p style="margin-top:1.25rem">
          <button class="ocs__btn alert-green fill large" type="button" data-action="start" disabled>Start Game</button>
        </p>
        <p class="game-weak" data-loading>Loading the maps…</p>
        <p class="game-weak"><span data-place-count></span></p>
        <p class="game-weak" data-stats></p>
      </div>

      <!-- Play -->
      <div data-screen="play" hidden>
        <div class="game-bar">
          <p class="game-stat"><strong data-round>Round 1 of 5</strong></p>
          <p class="game-stat" data-score></p>
          <p class="game-stat geo-timer" data-timer aria-live="off">30s</p>
        </div>
        <h2 class="game-prompt"><span data-who>Your turn</span>: <span data-target-name></span></h2>
        <p class="move-coach" data-instructions></p>
        <svg class="geo-board" data-board viewBox="0 0 1000 520" role="img" aria-label="Reference place and the place to resize"></svg>
        <div class="geo-controls">
          <button class="ocs__btn large" type="button" data-action="div10" aria-label="Divide area by 10">÷10</button>
          <button class="ocs__btn large" type="button" data-action="smaller" aria-label="Smaller">−</button>
          <button class="ocs__btn large" type="button" data-action="bigger" aria-label="Bigger">+</button>
          <button class="ocs__btn large" type="button" data-action="times10" aria-label="Multiply area by 10">×10</button>
          <button class="ocs__btn alert-red fill large geo-submit" type="button" data-action="submit">Submit</button>
        </div>
        <p class="game-weak">Drag the ↗ corner, use the buttons, or press the arrow keys.</p>
      </div>

      <!-- Pass the device (friend mode) -->
      <div data-screen="pass" hidden>
        <h2 class="game-prompt">Player 1 is locked in</h2>
        <p>Pass the device to <strong>Player 2</strong>. Player 2 starts from the same size Player 1 did.</p>
        <button class="ocs__btn alert-green fill large" type="button" data-action="pass-ready" data-pass-ready>Player 2: I'm Ready</button>
      </div>

      <!-- Reveal -->
      <div data-screen="reveal" hidden>
        <div class="game-bar">
          <p class="game-stat" data-score></p>
        </div>
        <h2 class="game-prompt" data-reveal-title></h2>
        <svg class="geo-board" data-reveal viewBox="0 0 1000 520" role="img" aria-label="Both guesses beside the real size"></svg>
        <p data-reveal-note></p>
        <div class="ocs__links">
          <button class="ocs__btn alert-green fill large" type="button" data-action="next" data-next>Next Round</button>
          <button class="ocs__btn" type="button" data-action="menu">Quit</button>
        </div>
      </div>

      <!-- Final -->
      <div data-screen="final" hidden>
        <h2 class="game-prompt" data-final-title></h2>
        <p class="move-count" data-final-score></p>
        <p data-final-note></p>
        <div class="ocs__links">
          <button class="ocs__btn alert-green fill large" type="button" data-action="start">Play Again</button>
          <button class="ocs__btn" type="button" data-action="menu">Change Settings</button>
        </div>
      </div>

    </div>
<noscript><p class="ocs__callout">This game needs JavaScript turned on in your browser.</p></noscript>

## Where the sizes come from

Shapes and sizes are calculated from real borders in the Natural Earth map data, using an equal-area map projection so each shape's size on screen is in true proportion. Sizes are land area, so lakes and coastal water are not counted. Far-away territories, like French Guiana for France, are left out of a country's shape.

<script type="module" src="{{ '/assets/js/fops/geography/game.js' | relative_url }}"></script>
