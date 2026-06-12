import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { RunnerHUD } from '../RunnerHUD';

describe('RunnerHUD Component', () => {
  it('renders multiplier section with correct value', () => {
    render(
      <RunnerHUD
        distance={100}
        snakeLength={8}
        highScore={200}
        score={150}
        multiplier={1}
        celebrating={false}
      />
    );
    expect(screen.getByText('x1')).toBeInTheDocument();
    expect(screen.getByText('Multiplier')).toBeInTheDocument();
  });

  it('renders multiplier x3 at length 20', () => {
    render(
      <RunnerHUD
        distance={500}
        snakeLength={20}
        highScore={500}
        score={400}
        multiplier={3}
        celebrating={false}
      />
    );
    expect(screen.getByText('x3')).toBeInTheDocument();
  });

  it('renders celebrating class when celebrating is true', () => {
    render(
      <RunnerHUD
        distance={100}
        snakeLength={10}
        highScore={100}
        score={50}
        multiplier={2}
        celebrating={true}
      />
    );
    const multiplierText = screen.getByText('x2');
    expect(multiplierText).toBeInTheDocument();
    const multiplierSection = multiplierText.closest('div');
    expect(multiplierSection).not.toBeNull();
    expect(multiplierSection!.className).toContain('celebrating');
  });

  it('does not apply celebrating class when celebrating is false', () => {
    render(
      <RunnerHUD
        distance={100}
        snakeLength={10}
        highScore={100}
        score={50}
        multiplier={2}
        celebrating={false}
      />
    );
    const multiplierText = screen.getByText('x2');
    const multiplierSection = multiplierText.closest('div');
    expect(multiplierSection!.className).not.toContain('celebrating');
  });

  it('renders score in gold section', () => {
    render(
      <RunnerHUD
        distance={100}
        snakeLength={5}
        highScore={200}
        score={150}
        multiplier={1}
        celebrating={false}
      />
    );
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('Score')).toBeInTheDocument();
  });

  it('renders length and distance', () => {
    render(
      <RunnerHUD
        distance={250}
        snakeLength={12}
        highScore={300}
        score={200}
        multiplier={2}
        celebrating={false}
      />
    );
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('250')).toBeInTheDocument();
  });
});
