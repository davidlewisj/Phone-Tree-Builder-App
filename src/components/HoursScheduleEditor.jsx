const WEEK_DAYS = [
  ['monday', 'Monday'],
  ['tuesday', 'Tuesday'],
  ['wednesday', 'Wednesday'],
  ['thursday', 'Thursday'],
  ['friday', 'Friday'],
  ['saturday', 'Saturday'],
  ['sunday', 'Sunday'],
];

export default function HoursScheduleEditor({ hoursSchedule, onChange, createDefaultSchedule }) {
  function updateDay(day, field, value) {
    const updated = {
      ...hoursSchedule,
      [day]: {
        ...(hoursSchedule?.[day] || { enabled: true, start: '09:00', end: '17:00' }),
        [field]: value,
      },
    };
    onChange(updated);
  }

  return (
    <div className="inspector-special">
      <h4 className="hours-title">Phone Hours Schedule</h4>
      <div className="hours-grid">
        {WEEK_DAYS.map(([dayKey, dayLabel]) => {
          const schedule = (hoursSchedule && hoursSchedule[dayKey]) || { enabled: true, start: '09:00', end: '17:00' };
          return (
            <div key={dayKey} className={`hours-row${schedule.enabled ? '' : ' hours-row--disabled'}`}>
              <label className="hours-day">
                <input
                  type="checkbox"
                  checked={Boolean(schedule.enabled)}
                  onChange={event => updateDay(dayKey, 'enabled', event.target.checked)}
                />
                <span>{dayLabel}</span>
              </label>
              <input
                type="time"
                className="form-input hours-time"
                value={schedule.start || '09:00'}
                onChange={event => updateDay(dayKey, 'start', event.target.value)}
                disabled={!schedule.enabled}
              />
              <input
                type="time"
                className="form-input hours-time"
                value={schedule.end || '17:00'}
                onChange={event => updateDay(dayKey, 'end', event.target.value)}
                disabled={!schedule.enabled}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
