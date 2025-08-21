/**
 * Enhanced Search Input Component Tests
 * Tests for the enhanced search input functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { EnhancedSearchInput } from '../EnhancedSearchInput';

describe('EnhancedSearchInput', () => {
  const mockOnChange = vi.fn();
  const mockOnSearchFieldsChange = vi.fn();
  const mockOnFuzzySearchChange = vi.fn();

  const defaultProps = {
    value: '',
    onChange: mockOnChange,
    onSearchFieldsChange: mockOnSearchFieldsChange,
    searchFields: ['name', 'email', 'description'],
    fuzzySearch: false,
    onFuzzySearchChange: mockOnFuzzySearchChange
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the search input with placeholder', () => {
    render(<EnhancedSearchInput {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('Search applications...')).toBeInTheDocument();
  });

  it('displays current search value', () => {
    render(<EnhancedSearchInput {...defaultProps} value="test search" />);
    
    expect(screen.getByDisplayValue('test search')).toBeInTheDocument();
  });

  it('calls onChange when input value changes', () => {
    render(<EnhancedSearchInput {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search applications...');
    fireEvent.change(input, { target: { value: 'new search' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('new search');
  });

  it('shows clear button when there is a value', () => {
    render(<EnhancedSearchInput {...defaultProps} value="test" />);
    
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('clears input when clear button is clicked', () => {
    render(<EnhancedSearchInput {...defaultProps} value="test" />);
    
    const clearButton = screen.getByRole('button');
    fireEvent.click(clearButton);
    
    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  it('shows search field options in popover', async () => {
    render(<EnhancedSearchInput {...defaultProps} />);
    
    const filterButton = screen.getAllByRole('button')[1]; // Second button is the filter
    fireEvent.click(filterButton);
    
    await waitFor(() => {
      expect(screen.getByText('Club Name')).toBeInTheDocument();
      expect(screen.getByText('Contact Email')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });
  });

  it('toggles search fields when checkboxes are clicked', async () => {
    render(<EnhancedSearchInput {...defaultProps} />);
    
    const filterButton = screen.getAllByRole('button')[1];
    fireEvent.click(filterButton);
    
    await waitFor(() => {
      const nameCheckbox = screen.getByLabelText(/Club Name/);
      fireEvent.click(nameCheckbox);
    });
    
    expect(mockOnSearchFieldsChange).toHaveBeenCalledWith(['email', 'description']);
  });

  it('shows fuzzy search option when onFuzzySearchChange is provided', async () => {
    render(<EnhancedSearchInput {...defaultProps} />);
    
    const filterButton = screen.getAllByRole('button')[1];
    fireEvent.click(filterButton);
    
    await waitFor(() => {
      expect(screen.getByText('Fuzzy Search')).toBeInTheDocument();
    });
  });

  it('toggles fuzzy search when checkbox is clicked', async () => {
    render(<EnhancedSearchInput {...defaultProps} />);
    
    const filterButton = screen.getAllByRole('button')[1];
    fireEvent.click(filterButton);
    
    await waitFor(() => {
      const fuzzyCheckbox = screen.getByLabelText(/Fuzzy Search/);
      fireEvent.click(fuzzyCheckbox);
    });
    
    expect(mockOnFuzzySearchChange).toHaveBeenCalledWith(true);
  });

  it('displays suggestions when provided', async () => {
    const suggestions = ['Football Club', 'Basketball Club'];
    render(
      <EnhancedSearchInput 
        {...defaultProps} 
        value="foot"
        suggestions={suggestions}
      />
    );
    
    const input = screen.getByPlaceholderText('Search applications...');
    fireEvent.focus(input);
    
    // Note: Suggestions filtering is based on keywords, so we need to trigger it properly
    fireEvent.change(input, { target: { value: 'football' } });
    
    await waitFor(() => {
      // The suggestions should be filtered and displayed
      expect(screen.queryByText('Suggestions')).toBeInTheDocument();
    });
  });

  it('shows active search indicators', () => {
    render(
      <EnhancedSearchInput 
        {...defaultProps} 
        value="test search"
        fuzzySearch={true}
        searchFields={['name']}
      />
    );
    
    expect(screen.getByText('Search: "test search"')).toBeInTheDocument();
    expect(screen.getByText('Fuzzy')).toBeInTheDocument();
    expect(screen.getByText('1 field')).toBeInTheDocument();
  });

  it('resets to default settings when reset button is clicked', async () => {
    render(<EnhancedSearchInput {...defaultProps} searchFields={['name']} />);
    
    const filterButton = screen.getAllByRole('button')[1];
    fireEvent.click(filterButton);
    
    await waitFor(() => {
      const resetButton = screen.getByText('Reset');
      fireEvent.click(resetButton);
    });
    
    expect(mockOnSearchFieldsChange).toHaveBeenCalledWith(['name', 'email', 'description']);
    expect(mockOnFuzzySearchChange).toHaveBeenCalledWith(false);
  });

  it('handles custom placeholder text', () => {
    render(
      <EnhancedSearchInput 
        {...defaultProps} 
        placeholder="Custom placeholder"
      />
    );
    
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <EnhancedSearchInput 
        {...defaultProps} 
        className="custom-class"
      />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});