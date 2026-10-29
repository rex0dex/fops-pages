---
layout: opencs
title: Spot the Scam
description: "Practice spotting scams in a safe place, before a real one shows up on your phone or in your email."
permalink: /scam-trainer/
hide: true
microblog: true
---
<!-- markdownlint-disable MD033 -->
<div class="fops-site">

{% include fops/header.html %}

<section class="fops-page-title">
    <div class="fops-container">
        <h1>Spot the Scam</h1>
        <p>Practice spotting scams in a safe place, before a real one shows up on your phone or in your email.</p>
    </div>
</section>

<section class="fops-section">
    <div class="fops-container">
        <div id="scam-game" class="fops-game" data-nod-scope>
      <div class="game-bar">
        <p class="game-stat">Messages: <strong data-rounds>0</strong></p>
        <p class="game-stat">Scams caught: <strong data-caught>0</strong></p>
        <button class="ocs__btn medium accent game-reset" type="button" data-reset data-nod-skip>Start Over</button>
      </div>
      <p class="game-weak" data-weak></p>
      <h2 class="game-prompt" data-prompt aria-live="polite">Loading…</h2>
      <div data-stage></div>
      <div class="game-feedback" data-feedback aria-live="polite"></div>
    </div>
        <noscript><p>This practice game needs JavaScript turned on in your browser.</p></noscript>
    </div>
</section>
<section class="fops-section fops-section--honey">
    <div class="fops-container">
        <div class="fops-cards">
            <div class="fops-card"><h3>Common Red Flags</h3><p>Someone asks you to pay with gift cards. The message says it is urgent, or that your account will be locked. A link or phone number you did not expect. Someone you know asking for money in an unusual way.</p></div>
            <div class="fops-card"><h3>Not sure about a message?</h3><p>Do not reply, click, or call back. Check with someone you trust first. A real company or family member will understand the wait. All the messages in this game are made up for practice.</p></div>
        </div>
    </div>
</section>
<script type="module" src="{{ '/assets/js/fops/scam/trainer.js' | relative_url }}"></script>

{% include fops/footer.html %}

</div>
