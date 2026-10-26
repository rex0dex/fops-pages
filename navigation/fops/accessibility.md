---
layout: fops
title: "Easier ways to play"
permalink: /accessibility/
back: "/play/"
back_label: "All games"
kicker: "Accessibility"
heading: "Play every game, <em>hands-free</em>"
lede: "Arthritis or shaky hands make a mouse and small buttons hard. Nod to select lets you play Spot the Scam, Bingo, and Size It Up with a gentle nod instead."
---

<section class="section" style="padding-top:1rem">
  <div class="wrap two-col">
    <div class="reveal">
      <h2>How Nod to select works</h2>
      <ol class="steps">
        <li><strong>Turn it on.</strong> Press <em>Nod to select</em> at the top of any page. Your browser asks to use the camera.</li>
        <li><strong>Hold still for a moment.</strong> The camera learns how you sit when you're resting.</li>
        <li><strong>Watch the gold outline.</strong> It moves slowly from button to button in the game.</li>
        <li><strong>Nod to press.</strong> Chin down, then back up. The outlined button is pressed for you.</li>
      </ol>
      <div class="btn-row" style="margin-top:1.5rem">
        <button class="btn btn-primary btn-lg" type="button" data-nod-toggle aria-pressed="false">Turn on Nod to select</button>
      </div>
    </div>
    <div class="card reveal">
      <h2>Your privacy</h2>
      <p>The camera only turns on when you choose it, and a panel in the corner shows it's on. All video is processed in this browser. Nothing is recorded, uploaded, or sent anywhere.</p>
      <ul class="ticks">
        <li>Turn it off any time with the <strong>Turn off</strong> button.</li>
        <li>Choose a slow, medium, or quick highlight speed.</li>
        <li>Only small, comfortable nods are needed. There is no timer.</li>
      </ul>
    </div>
  </div>
</section>

<section class="section section-tint">
  <div class="wrap">
    <div class="section-head reveal">
      <p class="kicker">Also on every page</p>
      <h2>Bigger text with one tap</h2>
      <p>Use the three <strong>A</strong> buttons at the top of the page to make all the text larger. The site remembers your choice.</p>
    </div>
    <div class="programs">
      <a class="program reveal" href="{{ '/scam-trainer/' | relative_url }}">
        <span class="program-icon">{% include fops/icon.html name="shield" %}</span>
        <h3>Spot the Scam</h3>
        <p>Nod to pick the message you trust, then nod on the red flag.</p>
        <span class="program-go">Try it {% include fops/icon.html name="arrow" %}</span>
      </a>
      <a class="program reveal" href="{{ '/bingo/play/' | relative_url }}">
        <span class="program-icon">{% include fops/icon.html name="bingo" %}</span>
        <h3>Bingo</h3>
        <p>Numbers are marked for you. Nod on BINGO! when you have a line.</p>
        <span class="program-go">Try it {% include fops/icon.html name="arrow" %}</span>
      </a>
      <a class="program reveal" href="{{ '/geography/' | relative_url }}">
        <span class="program-icon">{% include fops/icon.html name="globe" %}</span>
        <h3>Size It Up</h3>
        <p>Nod on bigger or smaller to resize the place, then nod on Submit.</p>
        <span class="program-go">Try it {% include fops/icon.html name="arrow" %}</span>
      </a>
    </div>
  </div>
</section>
