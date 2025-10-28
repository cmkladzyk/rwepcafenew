import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FilterBar } from '@/components/FilterBar';
import type { PlacesQuery } from '@/lib/types';

describe('FilterBar', () => {
  const noop = () => {};

  function setup(initial: PlacesQuery = {}) {
    const lastQuery: { current: PlacesQuery } = { current: initial };
    const onChange = (updater: (prev: PlacesQuery) => PlacesQuery) => {
      lastQuery.current = updater(lastQuery.current);
      rerender(
        <FilterBar
          query={lastQuery.current}
          onChange={onChange}
          onReset={noop}
          onRequestLocation={noop}
          onClearLocation={noop}
          locationStatus="idle"
        />
      );
    };

    const { rerender } = render(
      <FilterBar
        query={initial}
        onChange={onChange}
        onReset={noop}
        onRequestLocation={noop}
        onClearLocation={noop}
        locationStatus="idle"
      />
    );

    return { lastQuery, rerender };
  }

  it('updates search query and wifi filter', async () => {
    const { lastQuery } = setup();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/search by name/i), 'espresso');
    expect(lastQuery.current.q).toBe('espresso');

    await user.selectOptions(screen.getByLabelText(/minimum wi-fi rating/i), '4');
    expect(lastQuery.current.wifiMin).toBe(4);
  });

  it('toggles noise chips correctly', async () => {
    const { lastQuery } = setup();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /Quiet/i }));
    expect(lastQuery.current.noise).toEqual(['quiet']);

    await user.click(screen.getByRole('button', { name: /Quiet/i }));
    expect(lastQuery.current.noise).toBeUndefined();
  });

  it('calls reset handler', async () => {
    const handleReset = vi.fn();
    render(
      <FilterBar
        query={{ q: 'latte' }}
        onChange={() => {}}
        onReset={handleReset}
        onRequestLocation={noop}
        onClearLocation={noop}
        locationStatus="idle"
      />
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /reset filters/i }));
    expect(handleReset).toHaveBeenCalled();
  });
});
