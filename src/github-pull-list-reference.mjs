import { createHash } from 'node:crypto';

/**
 * Fully offline, non-executable request-binding reference for a FUTURE broker.
 * No credential, HTTP client, network request, token, agent identity or permit.
 * A hash of this proposed request is not permission to run anything.
 */
const RESOURCE = /^github:repo\/([A-Za-z0-9][A-Za-z0-9_.-]{0,38})\/([A-Za-z0-9][A-Za-z0-9_.-]{0,99})$/;
const INPUT_FIELDS = ['resource', 'page', 'perPage'];
const NO_EXECUTION = Object.freeze({ status: 'invalid-reference', executable: false });

function exactPlainObject(value) {
  return value !== null && typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype &&
    Object.keys(value).sort().join(',') === [...INPUT_FIELDS].sort().join(',');
}

/**
 * @param {{resource: string, page: number, perPage: number}} request
 * @returns frozen non-executable, credential-free synthetic request description.
 *
 * This never accepts URLs/hosts/headers/body/methods supplied by a caller.
 */
export function planSyntheticGitHubPullList(request) {
  try {
    if (!exactPlainObject(request) ||
      typeof request.resource !== 'string' ||
      !Number.isSafeInteger(request.page) || request.page < 1 || request.page > 100 ||
      !Number.isSafeInteger(request.perPage) ||
      request.perPage < 1 || request.perPage > 100) return NO_EXECUTION;

  const match = RESOURCE.exec(request.resource);
  if (!match || match[1] === '..' || match[2] === '..' ||
      // GitHub does not permit names with these path shapes.
      match[1].endsWith('.') || match[2].endsWith('.')) return NO_EXECUTION;

  const [ , owner, repository ] = match;
  const relativePath = '/repos/' + owner + '/' + repository +
    '/pulls?state=open&per_page=' + request.perPage + '&page=' + request.page;

  const spec = Object.freeze({
    status: 'proposed-reference',
    executable: false,
    host: 'api.github.com',
    method: 'GET',
    relativePath,
    redirectPolicy: 'deny',
    credentialPolicy: 'none',
    body: null,
    requestHash: createHash('sha256').update(
      JSON.stringify([
        'carnoa:github-pull-list-request:v1',
        'GET',
        'api.github.com',
        relativePath,
        'deny-redirects',
        'no-body',
        'no-credentials'
      ]), 'utf8'
    ).digest('base64')
  });
    return spec;
  } catch {
    // Malicious getters/Proxies must fail closed and never expose input data.
    return NO_EXECUTION;
  }
}
