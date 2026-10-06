---
layout: fops
title: Sign In
lede: Sign in to save your progress in games and practice.
permalink: /signin/
---

<section class="section">
  <div class="container">

    <div class="card form-card" id="account" hidden>
      <h2>You are signed in</h2>
      <p>Welcome, <strong data-account-name></strong>.</p>
      <div class="btn-row">
        <a class="btn btn-primary" href="{{ '/play/' | relative_url }}">Go to Play &amp; Learn</a>
        <button class="btn btn-outline" type="button" id="signout-button">Sign Out</button>
      </div>
    </div>

    <div class="card form-card" id="auth-forms">
      <div class="tabs" role="tablist" aria-label="Sign in or create an account">
        <button type="button" role="tab" id="tab-signin" aria-controls="panel-signin" aria-selected="true">Sign In</button>
        <button type="button" role="tab" id="tab-create" aria-controls="panel-create" aria-selected="false">Create Account</button>
      </div>

      <form id="panel-signin" role="tabpanel" aria-labelledby="tab-signin" novalidate>
        <div class="field">
          <label for="signin-username">Username</label>
          <input id="signin-username" name="username" autocomplete="username" required>
        </div>
        <div class="field">
          <label for="signin-password">Password</label>
          <input id="signin-password" name="password" type="password" autocomplete="current-password" required>
        </div>
        <p class="form-message" role="status" aria-live="polite"></p>
        <button class="btn btn-primary btn-lg" type="submit" style="width:100%">Sign In</button>
      </form>

      <form id="panel-create" role="tabpanel" aria-labelledby="tab-create" novalidate hidden>
        <div class="field">
          <label for="create-name">Your name</label>
          <input id="create-name" name="name" autocomplete="name" required>
        </div>
        <div class="field">
          <label for="create-username">Choose a username</label>
          <input id="create-username" name="username" autocomplete="username" required>
          <span class="hint">At least 2 letters or numbers. You will use this to sign in.</span>
        </div>
        <div class="field">
          <label for="create-password">Choose a password</label>
          <input id="create-password" name="password" type="password" autocomplete="new-password" required>
          <span class="hint">At least 8 characters.</span>
        </div>
        <p class="form-message" role="status" aria-live="polite"></p>
        <button class="btn btn-primary btn-lg" type="submit" style="width:100%">Create Account</button>
      </form>
    </div>

  </div>
</section>

<script type="module" src="{{ '/assets/js/fops/signin.js' | relative_url }}"></script>
