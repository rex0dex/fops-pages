---
layout: fops
title: "Your Profile"
lede: "Tell us what you're interested in, and we'll put the games and events you care about first."
permalink: /profile/
kicker: "Your account"
---

<section class="section" style="padding-top:1rem">
  <div class="wrap">

    <div class="note" data-profile-status>
      <p data-status-text>Checking whether you're signed in…</p>
    </div>

    <form class="card survey" id="interest-survey" novalidate>
      <h2>Your interests</h2>
      <p class="hint">Six quick questions. Tap your answers; there's no typing. You can change them any time.</p>
      <div data-questions></div>
      <p class="form-message" role="status" aria-live="polite"></p>
      <button class="btn btn-primary btn-lg" type="submit">Save My Answers</button>
    </form>

    <div class="card survey-results" style="margin-top:2rem" data-results hidden>
      <h2>Picked for you</h2>
      <p class="hint">Based on your answers.</p>
      <div class="programs" data-recommendations></div>
    </div>

  </div>
</section>

<script type="module" src="{{ '/assets/js/fops/profile.js' | relative_url }}"></script>
