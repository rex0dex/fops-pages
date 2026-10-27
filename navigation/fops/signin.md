---
layout: opencs
title: Sign In
description: "Sign in to save your progress in games and practice."
permalink: /signin/
custom_header: true
hide: true
---
<!-- markdownlint-disable MD033 -->
<div class="fops-site">

{% include fops/header.html %}

<section class="fops-page-title">
    <div class="fops-container">
        <h1>Sign In</h1>
        <p>Sign in to save your progress in games and practice.</p>
    </div>
</section>

<section class="fops-section">
    <div class="fops-container">
<div class="fops-card" id="account" hidden>
  <h2>You are signed in</h2>
  <p>Welcome, <strong data-account-name></strong>.</p>
<p class="hint" data-account-pending hidden>Your account is new, so a volunteer still needs to approve it. You can fill in your profile now; saved game progress turns on once you are approved.</p>
  <div class="ocs__links">
    <a class="ocs__btn medium accent fill" href="{{ '/profile/' | relative_url }}">Your Profile &amp; Interests</a>
    <a class="ocs__btn medium accent" href="{{ '/play/' | relative_url }}">Go to Play &amp; Learn</a>
    <button class="ocs__btn medium accent" type="button" id="signout-button">Sign Out</button>
  </div>
</div>
<div class="fops-card" id="auth-forms">
  <div class="tabs ocs__links" style="margin-bottom:1rem" role="tablist" aria-label="Sign in or create an account">
    <button type="button" class="ocs__btn medium accent" role="tab" id="tab-signin" aria-controls="panel-signin" aria-selected="true">Sign In</button>
    <button type="button" class="ocs__btn medium accent" role="tab" id="tab-create" aria-controls="panel-create" aria-selected="false">Create Account</button>
  </div>
  <form id="panel-signin" role="tabpanel" aria-labelledby="tab-signin" novalidate>
    <div class="fops-field">
      <label for="signin-username">Username</label>
      <input id="signin-username" name="username" autocomplete="username" required>
    </div>
    <div class="fops-field">
      <label for="signin-password">Password</label>
      <input id="signin-password" name="password" type="password" autocomplete="current-password" required>
    </div>
    <p class="form-message" role="status" aria-live="polite"></p>
    <button class="ocs__btn large accent fill" type="submit">Sign In</button>
  </form>
  <form id="panel-create" role="tabpanel" aria-labelledby="tab-create" novalidate hidden>
    <div class="fops-field">
      <label for="create-name">Your name</label>
      <input id="create-name" name="name" autocomplete="name" required>
    </div>
    <div class="fops-field">
      <label for="create-username">Choose a username</label>
      <input id="create-username" name="username" autocomplete="username" required>
      <br><small class="hint">At least 2 letters or numbers. You will use this to sign in.</small>
    </div>
    <div class="fops-field">
      <label for="create-password">Choose a password</label>
      <input id="create-password" name="password" type="password" autocomplete="new-password" required>
      <br><small class="hint">At least 8 characters.</small>
    </div>
    <p class="form-message" role="status" aria-live="polite"></p>
    <button class="ocs__btn large accent fill" type="submit">Create Account</button>
  </form>
</div>
    </div>
</section>
<script type="module" src="{{ '/assets/js/fops/signin.js' | relative_url }}"></script>

{% include fops/footer.html %}

</div>
