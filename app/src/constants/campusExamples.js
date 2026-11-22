// Example cards shown on the Campus Connect boards while a board has very few
// real posts. Every one is labelled Example and carries the UBP stamp, and none
// of them are real events, rides or items. They disappear as members post.
//
// Priority nights have no dates or venues yet, so they show question marks.

export const EXAMPLE_EVENTS = [
  { id: 'ex-pri-gal', name: "Priority New Year's Refresher", where: 'Galway', organiser: 'Priority', priority: true },
  { id: 'ex-pri-sli', name: "Priority New Year's Refresher", where: 'Sligo', organiser: 'Priority', priority: true },
  { id: 'ex-pri-dub', name: "Priority New Year's Refresher", where: 'Dublin', organiser: 'Priority', priority: true },
  { id: 'ex-pri-lim', name: "Priority New Year's Refresher", where: 'Limerick', organiser: 'Priority', priority: true },
  { id: 'ex-pri-bt', name: "Priority Black Tie", where: 'Sligo', organiser: 'Priority', priority: true },
  { id: 'ex-law', name: 'Law Society mixer', where: 'Student centre', organiser: 'Law Society', free: true },
  { id: 'ex-careers', name: 'Careers fair', where: 'Sports hall', organiser: 'Careers Service', free: true },
]

export const EXAMPLE_RIDES = [
  { id: 'ex-r1', from_location: 'Limerick City', to_location: 'Campus main gate', stops: ['Castletroy'], departure_time: '8:30am', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], seats_available: 2, contribution: 'Flexible' },
  { id: 'ex-r2', from_location: 'Cork City', to_location: 'Campus main gate', stops: [], departure_time: '9:00am', days: ['Mon', 'Wed', 'Fri'], seats_available: 3, contribution: 'Yes' },
  { id: 'ex-r3', from_location: 'Galway City', to_location: 'Arts building', stops: ['Salthill', 'Newcastle'], departure_time: '9:15am', days: ['Tue', 'Thu'], seats_available: 1, contribution: 'No' },
]

export const EXAMPLE_LOST_FOUND = [
  { id: 'ex-l1', status: 'Found', item_description: 'Blue rain jacket', location: 'Library, ground floor', ago: 'Example' },
  { id: 'ex-l2', status: 'Lost', item_description: 'Black wireless earbuds in a white case', location: 'Near the canteen', ago: 'Example' },
  { id: 'ex-l3', status: 'Found', item_description: 'Student card holder with a green strap', location: 'Lecture hall B', ago: 'Example' },
]
