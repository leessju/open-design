// @vitest-environment jsdom

// Composer Send-Queue shortcut — while a run is in flight, the same shortcut
// that normally submits the draft queues it instead. ChatPane owns the queue
// and auto-fires the first item when streaming flips false. There is no
// separate Queue button; Stop remains the only streaming action button.

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatComposer } from '../../src/components/ChatComposer';
import type { ProjectFile } from '../../src/types';

afterEach(() => {
  cleanup();
});

function baseProps() {
  return {
    projectId: 'project-1',
    projectFiles: [] as ProjectFile[],
    onEnsureProject: vi.fn(async () => 'project-1'),
    onSend: vi.fn(),
    onStop: vi.fn(),
  };
}

function getTextarea(): HTMLTextAreaElement {
  return document.querySelector('textarea') as HTMLTextAreaElement;
}

describe('ChatComposer Send-Queue shortcut', () => {
  it('does not render a Queue button when not streaming', () => {
    render(<ChatComposer {...baseProps()} streaming={false} onQueue={vi.fn()} />);
    expect(screen.queryByTestId('chat-queue')).toBeNull();
  });

  it('does not render a Queue button while streaming even if the draft has text', () => {
    render(<ChatComposer {...baseProps()} streaming={true} onQueue={vi.fn()} />);
    fireEvent.change(getTextarea(), { target: { value: 'follow-up prompt' } });
    expect(screen.queryByTestId('chat-queue')).toBeNull();
  });

  it('forwards the trimmed draft to onQueue and clears the textarea on Enter-to-send submit', () => {
    const onQueue = vi.fn();
    const onSend = vi.fn();
    render(
      <ChatComposer {...baseProps()} onSend={onSend} streaming={true} onQueue={onQueue} />,
    );
    const textarea = getTextarea();
    fireEvent.change(textarea, { target: { value: '  next thing to do  ' } });

    fireEvent.keyDown(textarea, {
      key: 'Enter',
    });

    expect(onQueue).toHaveBeenCalledTimes(1);
    expect(onQueue).toHaveBeenCalledWith('next thing to do');
    expect(textarea.value).toBe('');
    expect(onSend).not.toHaveBeenCalled();
  });

  it('queues on Cmd/Ctrl+Enter when Enter-to-send is disabled', () => {
    const onQueue = vi.fn();
    const onSend = vi.fn();
    render(
      <ChatComposer
        {...baseProps()}
        onSend={onSend}
        streaming={true}
        onQueue={onQueue}
        enterToSend={false}
      />,
    );
    const textarea = getTextarea();
    fireEvent.change(textarea, { target: { value: 'legacy shortcut follow-up' } });

    fireEvent.keyDown(textarea, {
      key: 'Enter',
      metaKey: true,
    });

    expect(onQueue).toHaveBeenCalledTimes(1);
    expect(onQueue).toHaveBeenCalledWith('legacy shortcut follow-up');
    expect(textarea.value).toBe('');
    expect(onSend).not.toHaveBeenCalled();
  });

  it('does not queue while streaming if no onQueue handler is provided', () => {
    const onSend = vi.fn();
    render(<ChatComposer {...baseProps()} onSend={onSend} streaming={true} />);
    const textarea = getTextarea();
    fireEvent.change(textarea, { target: { value: '  next thing to do  ' } });

    fireEvent.keyDown(textarea, {
      key: 'Enter',
    });

    expect(onSend).not.toHaveBeenCalled();
    expect(textarea.value).toBe('  next thing to do  ');
  });

  it('does not queue on Shift+Enter while streaming', () => {
    const onQueue = vi.fn();
    render(<ChatComposer {...baseProps()} streaming={true} onQueue={onQueue} />);
    const textarea = getTextarea();
    fireEvent.change(textarea, { target: { value: 'some text' } });

    fireEvent.keyDown(textarea, {
      key: 'Enter',
      shiftKey: true,
    });

    expect(onQueue).not.toHaveBeenCalled();
  });
});
