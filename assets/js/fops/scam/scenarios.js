// Practice message pairs for Spot the Scam.
// Every company, bank, and person here is made up. Each pair shows a real
// message beside a scam version of the same situation. Scam parts marked
// flag: true are the giveaways a player can tap; any of them counts.

export const SCAM_TYPES = {
  'gift-card': 'Paying with gift cards',
  'urgent-lock': 'Fake urgency: "your account is locked"',
  'family-emergency': 'A "family member" in trouble',
  'delivery': 'Fake delivery problem',
  'tech-support': 'Fake computer warning',
  'prize': 'A prize you never entered',
  'government': 'Fake government threat',
  'medicare': 'Fake health plan call',
};

export const SCENARIOS = [
  {
    id: 'gift-card-1',
    type: 'gift-card',
    channel: 'Text message',
    real: {
      from: 'Poway Library',
      parts: [
        { t: 'Poway Library: Your hold on "The Thursday Murder Club" is ready. ' },
        { t: 'Pick it up at the front desk by Friday.' },
      ],
    },
    scam: {
      from: '(619) 555-0148',
      parts: [
        { t: 'This is your pastor. I need a favor today and I am in a meeting. ' },
        { t: 'Please buy four $100 gift cards and text me the numbers on the back. ', flag: true },
        { t: 'I will pay you back Sunday.' },
      ],
    },
    explain: 'No real person, church, business, or government office asks to be paid with gift card numbers. Once you share the numbers, the money is gone.',
  },
  {
    id: 'urgent-lock-1',
    type: 'urgent-lock',
    channel: 'Email',
    real: {
      from: 'Coastal Federal Bank <alerts@coastalfederal.example>',
      parts: [
        { t: 'Your monthly statement is ready. ' },
        { t: 'Sign in to the Coastal Federal app or website the way you usually do to view it.' },
      ],
    },
    scam: {
      from: 'Coastal Federal Security <security@coastal-federal-verify.example>',
      parts: [
        { t: 'URGENT: Your account has been LOCKED due to suspicious activity. ', flag: true },
        { t: 'You must verify within 24 hours or your funds will be frozen. ', flag: true },
        { t: 'Click here to confirm your PIN and Social Security number.', flag: true },
      ],
    },
    explain: 'Scammers rush you so you do not stop to think. A real bank never asks for your PIN or Social Security number by email. Call the number on the back of your card instead.',
  },
  {
    id: 'family-emergency-1',
    type: 'family-emergency',
    channel: 'Phone call',
    real: {
      from: 'Your granddaughter, Emma',
      parts: [
        { t: 'Hi Grandma, it is Emma! ' },
        { t: 'Just calling to say I got the birthday card. Can I come by Sunday for lunch?' },
      ],
    },
    scam: {
      from: 'Unknown caller',
      parts: [
        { t: 'Grandma? It is me. I was in a car accident and I am in jail. ' },
        { t: 'Please do not tell Mom and Dad. ', flag: true },
        { t: 'My lawyer needs $3,000 in cash today. A courier will come to your house to pick it up.', flag: true },
      ],
    },
    explain: 'The "do not tell anyone" line keeps you from checking the story. Hang up and call your grandchild or their parents at a number you already know.',
  },
  {
    id: 'delivery-1',
    type: 'delivery',
    channel: 'Text message',
    real: {
      from: 'Parcel Express',
      parts: [
        { t: 'Parcel Express: Your package was delivered to your front porch at 2:14 PM. ' },
        { t: 'No action needed.' },
      ],
    },
    scam: {
      from: '+44 7700 900461',
      parts: [
        { t: 'Your package could not be delivered due to an unpaid $1.99 fee. ', flag: true },
        { t: 'Update your card details here: parcel-redelivery-help.example', flag: true },
      ],
    },
    explain: 'Delivery companies do not text you to collect small fees through a link. A strange link plus a request for card details is a trap.',
  },
  {
    id: 'tech-support-1',
    type: 'tech-support',
    channel: 'Pop-up on your computer',
    real: {
      from: 'Your computer',
      parts: [
        { t: 'Updates are ready to install. ' },
        { t: 'Your computer will restart tonight at 2:00 AM. You can choose another time in Settings.' },
      ],
    },
    scam: {
      from: 'SECURITY ALERT',
      parts: [
        { t: 'VIRUS DETECTED! Your files will be deleted. ', flag: true },
        { t: 'Do not turn off your computer. ' },
        { t: 'Call Computer Support now at 1-888-555-0199.', flag: true },
      ],
    },
    explain: 'Real computer warnings never give you a phone number to call. Scammers on that line will ask to control your computer or charge you for a fake fix. Close the window or restart.',
  },
  {
    id: 'prize-1',
    type: 'prize',
    channel: 'Letter in the mail',
    real: {
      from: 'Poway Senior Center',
      parts: [
        { t: 'Thank you for entering our raffle at the Spring Fair. ' },
        { t: 'Winners will be announced at the community center on May 3.' },
      ],
    },
    scam: {
      from: 'International Sweepstakes Board',
      parts: [
        { t: 'CONGRATULATIONS! You have won $850,000! ', flag: true },
        { t: 'To release your prize, send a $499 processing fee by wire transfer.', flag: true },
      ],
    },
    explain: 'You cannot win a contest you never entered, and real prizes never require you to pay a fee first.',
  },
  {
    id: 'government-1',
    type: 'government',
    channel: 'Voicemail',
    real: {
      from: 'County of San Diego',
      parts: [
        { t: 'This is a reminder that your property tax bill was mailed this week. ' },
        { t: 'Payment details are printed on the bill.' },
      ],
    },
    scam: {
      from: 'Unknown caller',
      parts: [
        { t: 'This is the tax office. There is a warrant for your arrest for unpaid taxes. ', flag: true },
        { t: 'Pay today with gift cards or Bitcoin to avoid jail.', flag: true },
      ],
    },
    explain: 'Government offices contact you by mail first. They never threaten arrest over the phone, and they never take gift cards or Bitcoin.',
  },
  {
    id: 'medicare-1',
    type: 'medicare',
    channel: 'Phone call',
    real: {
      from: "Dr. Patel's office",
      parts: [
        { t: 'Hello, this is Dr. Patel\'s office confirming your appointment Tuesday at 10:00 AM. ' },
        { t: 'Please call us back if you need to change it.' },
      ],
    },
    scam: {
      from: 'Unknown caller',
      parts: [
        { t: 'Hello, I am calling about your new health benefits card. ' },
        { t: 'Your old card expires today. ', flag: true },
        { t: 'To send your new card, I just need to confirm your Medicare number.', flag: true },
      ],
    },
    explain: 'Medicare will not call you to "confirm" your number. Your Medicare number is like a bank PIN. Only share it with your own doctor or pharmacy.',
  },
  {
    id: 'gift-card-2',
    type: 'gift-card',
    channel: 'Email',
    real: {
      from: 'Bookworm Shop <orders@bookworm.example>',
      parts: [
        { t: 'Thanks for your order! Your gift card for $25 has been emailed to Linda as you asked. ' },
        { t: 'Your receipt is attached.' },
      ],
    },
    scam: {
      from: 'Utility Billing <billing-dept@power-payments.example>',
      parts: [
        { t: 'Your power will be shut off in 1 hour. ', flag: true },
        { t: 'To keep service on, buy a store gift card and reply with the card number.', flag: true },
      ],
    },
    explain: 'Utility companies send written notices first, and never take payment with gift cards. A one-hour shut-off threat is meant to panic you.',
  },
  {
    id: 'urgent-lock-2',
    type: 'urgent-lock',
    channel: 'Text message',
    real: {
      from: 'Coastal Federal Bank',
      parts: [
        { t: 'Coastal Federal: A charge of $42.10 at Poway Grocery was approved. ' },
        { t: 'If this was not you, call the number on the back of your card.' },
      ],
    },
    scam: {
      from: '(858) 555-0177',
      parts: [
        { t: 'Coastal Federal: Unusual sign-in detected. ' },
        { t: 'Reply with the 6-digit code we just sent you to stop it.', flag: true },
      ],
    },
    explain: 'Sign-in codes are only for you to type into the real website. Anyone asking you to read or send them a code is trying to get into your account.',
  },
];
