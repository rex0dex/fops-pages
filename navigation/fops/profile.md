---
layout: post
title: Your Profile
description: Tell us what you're interested in, and we'll put the games and events you care about first.
permalink: /profile/
toc: false
comments: false
show_reading_time: false
---

<div class="ocs__callout" data-profile-status>
  <p data-status-text>Checking whether you're signed in…</p>
</div>
<form class="ocs__card" id="interest-survey" novalidate>
  <h2>Your interests</h2>
  <p class="hint">Six quick questions. Tap your answers; there's no typing. You can change them any time.</p>
  <div data-questions></div>
  <p class="form-message" role="status" aria-live="polite"></p>
  <button class="ocs__btn alert-green fill large" type="submit">Save My Answers</button>
</form>
<div class="ocs__card" data-results hidden>
  <h2>Picked for you</h2>
  <p class="hint">Based on your answers.</p>
  <div class="ocs__grid ocs__grid--standard cols-2" data-recommendations></div>
</div>
<script type="module" src="{{ '/assets/js/fops/profile.js' | relative_url }}"></script>
