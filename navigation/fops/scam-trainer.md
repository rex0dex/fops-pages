---
layout: fops
title: "Spot the Scam"
lede: "Practice spotting scams in a safe place, before a real one shows up on your phone or in your email."
permalink: /scam-trainer/
back: "/play/"
back_label: "All games"
kicker: "Practice"
---

<section class="section" style="padding-top:1rem">
  <div class="wrap">
    <div id="scam-game" class="game" data-nod-scope>
      <div class="game-bar">
        <p class="game-stat">Messages: <strong data-rounds>0</strong></p>
        <p class="game-stat">Scams caught: <strong data-caught>0</strong></p>
        <button class="btn btn-ghost game-reset" type="button" data-reset data-nod-skip>Start Over</button>
      </div>
      <p class="game-weak" data-weak></p>
      <h2 class="game-prompt" data-prompt aria-live="polite">Loading…</h2>
      <div data-stage></div>
      <div class="game-feedback" data-feedback aria-live="polite"></div>
    </div>
    <noscript><p class="note">This practice game needs JavaScript turned on in your browser.</p></noscript>
  </div>
</section>

<section class="section section-tint">
  <div class="wrap two-col">
    <div>
      <h2>Common Red Flags</h2>
      <ul class="ticks warn">
        <li>Someone asks you to pay with gift cards.</li>
        <li>The message says it is urgent, or that your account will be locked.</li>
        <li>A link or phone number you did not expect.</li>
        <li>Someone you know asking for money in an unusual way.</li>
      </ul>
    </div>
    <div class="note">
      <h2>Not sure about a message?</h2>
      <p>Do not reply, click, or call back. Check with someone you trust first. A real company or family member will understand the wait.</p>
      <p>All the messages in this game are made up for practice.</p>
    </div>
  </div>
</section>

<script type="module" src="{{ '/assets/js/fops/scam/trainer.js' | relative_url }}"></script>
