// Pre-restructure URLs that must keep resolving. Every entry renders a stub at
// `from` pointing at `to` (CLAUDE.md §4: a URL change requires a redirect).
module.exports = [
  { from: "/escalations/", to: "/countermeasures/" },
  { from: "/uk/escalations/", to: "/uk/countermeasures/" }
];
