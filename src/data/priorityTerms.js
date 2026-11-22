// Terms of sale for Priority tickets. One copy for the event page, the
// /priority/terms page and the Terms of Service. The app has its own copy in
// app/src/constants/priorityEvents.js. Keep both in step. Plain words, no dashes.

export const PRIORITY_TERMS_INTRO =
  'These terms apply when you buy a ticket to a Priority event on this website.'

export const PRIORITY_TERMS = [
  {
    title: 'Who runs the event',
    text: 'Priority Events organises the event and is the seller of the ticket. UniBlueprint is only the ticket shop. Priority Events takes the payment and looks after its own VAT.',
  },
  {
    title: 'You must be 18 or over',
    text: 'Every Priority event is 18 plus. We check the date of birth on your UniBlueprint account before you pay. Entry can be refused at the door if you cannot show you are 18 or over.',
  },
  {
    title: 'What you pay',
    text: 'You pay the ticket price shown. There is no booking fee.',
  },
  {
    title: 'When you get your ticket',
    text: 'Your ticket is issued after your payment is confirmed. You will find it, with its QR code, in My tickets.',
  },
  {
    title: 'Refunds',
    text: 'There are no refunds if you change your mind. If the event is cancelled, you get a refund of the ticket price.',
  },
]

// The lines shown right above the Buy button, before anyone pays.
export const PRIORITY_TERMS_SHORT = [
  '18 plus only. You pay the ticket price, with no booking fee.',
  'No refunds if you change your mind. If the event is cancelled, you are refunded.',
  'Priority Events organises the event. UniBlueprint is only the ticket shop.',
]

// Announced by Priority. No dates or venues are set yet, so they show ??.
// These are not events on sale. Real events come from the database only.
export const PRIORITY_ANNOUNCED = [
  { id: 'refresher', title: "New Year's Refresher", where: 'Galway, Sligo, Dublin and Limerick' },
  { id: 'black-tie', title: 'Black Tie', where: 'Sligo' },
]
