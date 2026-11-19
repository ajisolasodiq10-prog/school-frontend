// Turns a flat list of terms into [{ session, terms: [...] }, ...],
// keeping the original (newest-first) order.
export default function groupBySession(terms) {
  const groups = [];
  terms.forEach((term) => {
    let group = groups.find((item) => item.session === term.session);
    if (!group) {
      group = { session: term.session, terms: [] };
      groups.push(group);
    }
    group.terms.push(term);
  });
  return groups;
}
