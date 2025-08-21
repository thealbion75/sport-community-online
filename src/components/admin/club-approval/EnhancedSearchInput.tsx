/**
 * Enhanced Search Input Component
 * Provides advanced search functionality with suggestions and fuzzy matching
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Filter, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { normalizeSearchTerm, extractSearchKeywords } from '@/lib/utils/search-utils';

interface EnhancedSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearchFieldsChange: (fields: string[]) => void;
  searchFields: string[];
  placeholder?: string;
  suggestions?: string[];
  fuzzySearch?: boolean;
  onFuzzySearchChange?: (enabled: boolean) => void;
  className?: string;
}

export const EnhancedSearchInput: React.FC<EnhancedSearchInputProps> = ({
  value,
  onChange,
  onSearchFieldsChange,
  searchFields,
  placeholder = "Search applications...",
  suggestions = [],
  fuzzySearch = false,
  onFuzzySearchChange,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions based on current input
  useEffect(() => {
    if (value && suggestions.length > 0) {
      const keywords = extractSearchKeywords(value);
      const filtered = suggestions.filter(suggestion => {
        const normalizedSuggestion = normalizeSearchTerm(suggestion);
        return keywords.some(keyword => 
          normalizedSuggestion.includes(keyword)
        );
      }).slice(0, 5); // Limit to 5 suggestions
      
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0 && value.length > 1);
    } else {
      setShowSuggestions(false);
    }
  }, [value, suggestions]);

  const handleSearchFieldToggle = (field: string, checked: boolean) => {
    if (checked) {
      onSearchFieldsChange([...searchFields, field]);
    } else {
      onSearchFieldsChange(searchFields.filter(f => f !== field));
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const searchFieldOptions = [
    { id: 'name', label: 'Club Name', icon: '🏢' },
    { id: 'email', label: 'Contact Email', icon: '📧' },
    { id: 'description', label: 'Description', icon: '📝' }
  ];

  const activeFieldsCount = searchFields.length;
  const hasAdvancedOptions = fuzzySearch || activeFieldsCount !== 3;

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-20"
          onFocus={() => setShowSuggestions(filteredSuggestions.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
        
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {value && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 relative"
              >
                <Filter className="h-3 w-3" />
                {hasAdvancedOptions && (
                  <div className="absolute -top-1 -right-1 h-2 w-2 bg-blue-500 rounded-full" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-3">Search In</h4>
                  <div className="space-y-2">
                    {searchFieldOptions.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`search-${option.id}`}
                          checked={searchFields.includes(option.id)}
                          onCheckedChange={(checked) => 
                            handleSearchFieldToggle(option.id, checked as boolean)
                          }
                        />
                        <Label 
                          htmlFor={`search-${option.id}`}
                          className="text-sm font-normal flex items-center gap-2"
                        >
                          <span>{option.icon}</span>
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {onFuzzySearchChange && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium text-sm mb-3">Search Options</h4>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="fuzzy-search"
                          checked={fuzzySearch}
                          onCheckedChange={(checked) => 
                            onFuzzySearchChange(checked as boolean)
                          }
                        />
                        <Label 
                          htmlFor="fuzzy-search"
                          className="text-sm font-normal flex items-center gap-2"
                        >
                          <Zap className="h-3 w-3" />
                          Fuzzy Search
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Find results even with typos or partial matches
                      </p>
                    </div>
                  </>
                )}

                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {activeFieldsCount} field{activeFieldsCount !== 1 ? 's' : ''} selected
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onSearchFieldsChange(['name', 'email', 'description']);
                      onFuzzySearchChange?.(false);
                    }}
                    className="h-6 text-xs"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Search Suggestions */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs text-muted-foreground mb-2">Suggestions</div>
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded text-foreground"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Search Indicators */}
      {(value || hasAdvancedOptions) && (
        <div className="flex flex-wrap gap-1 mt-2">
          {value && (
            <Badge variant="secondary" className="text-xs">
              Search: "{value}"
            </Badge>
          )}
          {fuzzySearch && (
            <Badge variant="outline" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Fuzzy
            </Badge>
          )}
          {activeFieldsCount < 3 && (
            <Badge variant="outline" className="text-xs">
              {activeFieldsCount} field{activeFieldsCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedSearchInput;