import { useState, useRef, useEffect } from 'react';
import { Search, User, X } from 'lucide-react';
import { User as UserType } from '../../types';
import { roleLabel } from './Badge';

interface PatientSearchProps {
  patients: UserType[];
  selectedId: string;
  onSelect: (patient: UserType | null) => void;
  placeholder?: string;
}

export default function PatientSearch({ patients, selectedId, onSelect, placeholder = 'Search patient by name or email...' }: PatientSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedPatient = patients.find((p) => p.id === selectedId) || null;

  const filtered = query.trim()
    ? patients.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.email.toLowerCase().includes(query.toLowerCase()) ||
        (p.studentId?.toLowerCase().includes(query.toLowerCase()) ?? false) ||
        (p.employeeId?.toLowerCase().includes(query.toLowerCase()) ?? false) ||
        (p.facultyId?.toLowerCase().includes(query.toLowerCase()) ?? false)
      )
    : patients;

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const patient = filtered[highlightedIndex];
      if (patient) {
        onSelect(patient);
        setQuery('');
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (patient: UserType) => {
    onSelect(patient);
    setQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelect(null);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      {selectedPatient ? (
        <div className="flex items-center gap-3 px-3 py-2 bg-sky-50 border border-sky-200 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
            <span className="text-sky-600 font-bold text-sm">{selectedPatient.name.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-700 truncate">{selectedPatient.name}</p>
            <p className="text-xs text-slate-500 truncate">{selectedPatient.email} · {roleLabel(selectedPatient.role)}</p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
            title="Clear selection"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent bg-white"
          />
        </div>
      )}

      {isOpen && !selectedPatient && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-400 flex items-center gap-2">
              <User size={14} />
              No patients found
            </div>
          ) : (
            <ul className="py-1">
              {filtered.map((patient, index) => (
                <li
                  key={patient.id}
                  onClick={() => handleSelect(patient)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-4 py-2.5 cursor-pointer flex items-center gap-3 transition-colors ${
                    index === highlightedIndex ? 'bg-sky-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                    <span className="text-sky-600 font-bold text-sm">{patient.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{patient.name}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {patient.email} · {roleLabel(patient.role)}
                      {patient.studentId ? ` · ${patient.studentId}` : patient.employeeId ? ` · ${patient.employeeId}` : patient.facultyId ? ` · ${patient.facultyId}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
