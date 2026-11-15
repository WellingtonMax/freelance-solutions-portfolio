#!/usr/bin/env bash
# P01-F01: disposable combined-tree check for PR #83 (UX) and #84 (frontend).
# No push, remote merge, deploy, credentials or persistent checkout.
set -Eeuo pipefail
if [[ $# -gt 1 || ( $# -eq 1 && "$1" != '--browser' ) ]]; then
  echo 'Usage: check_excel_rescue_combined_ux.sh [--browser]' >&2
  exit 2
fi
for cmd in git python3 node; do
  command -v "$cmd" >/dev/null || { echo "Missing: $cmd" >&2; exit 2; }
done
if [[ ${1:-} == '--browser' ]]; then
  python3 -c 'import playwright.sync_api' || {
    echo 'Browser acceptance requires Python Playwright and installed Chromium; no browser test was run.' >&2
    exit 2
  }
fi
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
git clone --quiet --no-checkout https://github.com/WellingtonMax/freelance-solutions-portfolio.git "$tmp/repo"
cd "$tmp/repo"
git fetch --quiet origin refs/pull/83/head:refs/remotes/origin/ux83 refs/pull/84/head:refs/remotes/origin/front84
ux="$(git rev-parse refs/remotes/origin/ux83)"
front="$(git rev-parse refs/remotes/origin/front84)"
# Optional SHA pins prevent a moving PR head from silently changing the tested pair.
# Set both variables to the full SHAs verified in the PR review.
if [[ -n "${UX_EXPECTED_SHA:-}" || -n "${FRONTEND_EXPECTED_SHA:-}" ]]; then
  if [[ ! "${UX_EXPECTED_SHA:-}" =~ ^[0-9a-f]{40}$ || ! "${FRONTEND_EXPECTED_SHA:-}" =~ ^[0-9a-f]{40}$ ]]; then
    echo 'Set BOTH UX_EXPECTED_SHA and FRONTEND_EXPECTED_SHA to full 40-character lowercase SHAs.' >&2
    exit 2
  fi
  if [[ "$ux" != "$UX_EXPECTED_SHA" || "$front" != "$FRONTEND_EXPECTED_SHA" ]]; then
    printf 'PR heads changed; refusing stale integration evidence. UX=%s Frontend=%s\\n' "$ux" "$front" >&2
    exit 1
  fi
else
  echo 'UNPINNED CHECK: PR heads may move; record the printed SHAs before citing results.' >&2
fi
printf 'UX PR #83: %s\nFrontend PR #84: %s\n' "$ux" "$front"
# Exercise the exact integration target as well as both PR heads.
# Starting from UX alone could pass while current main has conflicting changes.
base="$(git rev-parse refs/remotes/origin/HEAD)"
printf 'Integration base (remote default branch): %s\n' "$base"
git checkout --quiet --detach "$base"
git -c user.name='Disposable UX check' -c user.email='ux-check@example.invalid' merge --no-ff --no-edit "$ux"
git -c user.name='Disposable UX check' -c user.email='ux-check@example.invalid' merge --no-ff --no-edit "$front"
printf 'Combined local commit: %s\n' "$(git rev-parse HEAD)"
cd 01-excel-rescue
python3 -m unittest discover -v
# These suites are required for the combined UX/frontend handoff.
# A missing test must fail the check, not produce a misleading green result.
for test in try-ui.test.cjs test_sample_ui.cjs test_sample_one_click.cjs; do
  if [[ ! -f "$test" ]]; then
    echo "Required combined-tree test missing: $test" >&2
    exit 1
  fi
  node --test "$test"
done
if [[ ${1:-} == '--browser' ]]; then
  echo 'Running Chromium browser regression on the COMBINED tree (not a screen-reader audit).'
  if [[ ! -f check_try_browser.py ]]; then
    echo 'Required Chromium acceptance script missing: check_try_browser.py' >&2
    exit 1
  fi
  python3 check_try_browser.py
else
  echo 'Browser regression NOT RUN. Re-run with --browser after installing Playwright and Chromium.'
fi
echo 'Manual acceptance still required: screen reader, 400% zoom, and independent keyboard review. No CI or merge approval implied.'
