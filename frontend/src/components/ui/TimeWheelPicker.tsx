import { useEffect, useRef, type KeyboardEvent, type UIEvent } from "react";

import { useLanguage } from "../../hooks/useLanguage";

const ITEM_HEIGHT = 44;
const hours = Array.from({ length: 12 }, (_, index) => String(index + 1));
const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"));
const periods = ["AM", "PM"] as const;

function preferredScrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

interface WheelColumnProps {
  label: string;
  options: readonly string[];
  selected: string;
  optionLabel?: (value: string) => string;
  onSelect: (value: string) => void;
}

function WheelColumn({ label, options, selected, optionLabel = (value) => value, onSelect }: WheelColumnProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedIndex = Math.max(0, options.indexOf(selected));

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const target = selectedIndex * ITEM_HEIGHT;
    if (Math.abs(list.scrollTop - target) > 1) list.scrollTo({ top: target });
  }, [selectedIndex]);

  useEffect(() => () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
  }, []);

  function settleSelection(event: UIEvent<HTMLDivElement>) {
    const list = event.currentTarget;
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const index = Math.max(0, Math.min(options.length - 1, Math.round(list.scrollTop / ITEM_HEIGHT)));
      const nextValue = options[index];
      if (nextValue && nextValue !== selected) onSelect(nextValue);
      const target = index * ITEM_HEIGHT;
      if (Math.abs(list.scrollTop - target) > 1) list.scrollTo({ top: target, behavior: preferredScrollBehavior() });
    }, 80);
  }

  function moveSelection(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const offset = event.key === "ArrowDown" ? 1 : -1;
    const index = Math.max(0, Math.min(options.length - 1, selectedIndex + offset));
    const nextValue = options[index];
    if (nextValue) onSelect(nextValue);
  }

  return (
    <div className="time-wheel-part">
      <span className="time-wheel-label">{label}</span>
      <div
        ref={listRef}
        className="time-wheel-column"
        role="listbox"
        aria-label={label}
        aria-activedescendant={`time-wheel-${label}-${selected}`}
        tabIndex={0}
        onScroll={settleSelection}
        onKeyDown={moveSelection}
      >
        {options.map((option, index) => (
          <button
            id={`time-wheel-${label}-${option}`}
            key={option}
            type="button"
            role="option"
            aria-selected={option === selected}
            className={option === selected ? "is-selected" : ""}
            onClick={() => {
              onSelect(option);
              listRef.current?.scrollTo({ top: index * ITEM_HEIGHT, behavior: preferredScrollBehavior() });
            }}
          >
            {optionLabel(option)}
          </button>
        ))}
      </div>
    </div>
  );
}

interface TimeWheelPickerProps {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}

export function TimeWheelPicker({ value, onChange, ariaLabel }: TimeWheelPickerProps) {
  const { language, tr } = useLanguage();
  const [hour24 = "08", minute = "00"] = value.split(":");
  const hourNumber = Number(hour24);
  const selectedHour = String((hourNumber % 12) || 12);
  const selectedPeriod = hourNumber >= 12 ? "PM" : "AM";
  const numberFormatter = new Intl.NumberFormat(language === "ar" ? "ar-EG" : "en-GB", { useGrouping: false });

  function update(nextHour = selectedHour, nextMinute = minute, nextPeriod = selectedPeriod) {
    const nextHour24 = Number(nextHour) % 12 + (nextPeriod === "PM" ? 12 : 0);
    onChange(`${String(nextHour24).padStart(2, "0")}:${nextMinute}`);
  }

  return (
    <div className="iphone-time-picker" role="group" aria-label={ariaLabel} dir="ltr">
      <div className="time-wheel-selection" aria-hidden="true" />
      <WheelColumn
        label={tr("Hour", "الساعة")}
        options={hours}
        selected={selectedHour}
        optionLabel={(option) => numberFormatter.format(Number(option))}
        onSelect={(nextHour) => update(nextHour)}
      />
      <span className="time-wheel-separator" aria-hidden="true">:</span>
      <WheelColumn
        label={tr("Minute", "الدقيقة")}
        options={minutes}
        selected={minute}
        optionLabel={(option) => numberFormatter.format(Number(option)).padStart(2, language === "ar" ? "٠" : "0")}
        onSelect={(nextMinute) => update(selectedHour, nextMinute)}
      />
      <WheelColumn
        label={tr("Period", "الفترة")}
        options={periods}
        selected={selectedPeriod}
        optionLabel={(option) => language === "ar" ? (option === "AM" ? "ص" : "م") : option}
        onSelect={(nextPeriod) => update(selectedHour, minute, nextPeriod)}
      />
      <output className="time-wheel-value" aria-live="polite">
        {numberFormatter.format(Number(selectedHour))}:{numberFormatter.format(Number(minute)).padStart(2, language === "ar" ? "٠" : "0")} {language === "ar" ? (selectedPeriod === "AM" ? "ص" : "م") : selectedPeriod}
      </output>
    </div>
  );
}
