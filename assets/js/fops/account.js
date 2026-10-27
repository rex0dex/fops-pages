// Who is signed in, for every Friends of Poway Seniors page.
// Uses /api/fops/profile/me because it also answers for new accounts that are
// still waiting for a volunteer to approve them; OCS's /api/id refuses those
// with 403, which made a fresh sign-in look like it had failed.
import { pythonURI, fetchOptions } from '../api/config.js';

// Returns { id, uid, name, role, active } or null when nobody is signed in.
export async function currentMember() {
  try {
    const response = await fetch(`${pythonURI}/api/fops/profile/me`, fetchOptions);
    return response.ok ? await response.json() : null;
  } catch (e) {
    return null; // backend not reachable
  }
}
