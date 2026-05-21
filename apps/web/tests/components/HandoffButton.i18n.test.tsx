// @vitest-environment jsdom

// Regression guard for the hand-off split button rendering hardcoded
// Chinese ("交付给 …") regardless of the active locale. The label, the
// generic fallback, the picker aria-label, the "Not installed" section,
// and the per-editor "not detected" title must all flow through the
// real i18n dictionaries — so an English (or any non-Chinese) locale
// never leaks CJK text.

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HandoffButton } from '../../src/components/HandoffButton';
import { I18nProvider } from '../../src/i18n';
import type { HostEditorsResponse } from '@open-design/contracts';

const fetchHostEditors = vi.fn<() => Promise<HostEditorsResponse>>();

vi.mock('../../src/providers/registry', () => ({
  fetchHostEditors: () => fetchHostEditors(),
  openProjectInEditor: vi.fn(),
}));

const CJK = /[㐀-鿿]/;

afterEach(() => {
  cleanup();
  fetchHostEditors.mockReset();
});

describe('HandoffButton localization', () => {
  it('renders the English hand-off label, never hardcoded Chinese', async () => {
    fetchHostEditors.mockResolvedValue({
      platform: 'darwin',
      editors: [{ id: 'vscode', label: 'VS Code', available: true }],
    });

    render(
      <I18nProvider initial="en">
        <HandoffButton projectId="p1" />
      </I18nProvider>,
    );

    const label = await screen.findByText('Hand off to VS Code');
    expect(label).toBeTruthy();

    const trigger = screen.getByTestId('handoff-trigger');
    expect(CJK.test(trigger.textContent ?? '')).toBe(false);
    expect(trigger.getAttribute('title')).toBe('Hand off to VS Code');
  });

  it('localizes the picker affordances under a non-Chinese locale', async () => {
    fetchHostEditors.mockResolvedValue({
      platform: 'darwin',
      editors: [
        { id: 'vscode', label: 'VS Code', available: true },
        { id: 'cursor', label: 'Cursor', available: false },
      ],
    });

    render(
      <I18nProvider initial="ko">
        <HandoffButton projectId="p1" />
      </I18nProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('handoff-caret')).toBeTruthy();
    });

    const caret = screen.getByTestId('handoff-caret');
    // aria-label flows through i18n, so it must not be the literal English key.
    expect(caret.getAttribute('aria-label')).toBe('전달 대상 선택');
    expect(CJK.test(caret.getAttribute('aria-label') ?? '')).toBe(false);
  });
});
