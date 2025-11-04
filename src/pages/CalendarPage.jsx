import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalMenu from '../components/UniversalMenu';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import addMonths from 'date-fns/addMonths';
import subMonths from 'date-fns/subMonths';
import addWeeks from 'date-fns/addWeeks';
import subWeeks from 'date-fns/subWeeks';
import isSameDay from 'date-fns/isSameDay';
import isSameMonth from 'date-fns/isSameMonth';
import api from '../services/api';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/CalendarPage.css';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const CATEGORIES = [
  { key: 'work', label: 'İş', color: '#4285F4' },
  { key: 'school', label: 'Okul', color: '#34A853' },
  { key: 'travel', label: 'Seyahat', color: '#FBBC05' },
  { key: 'special', label: 'Özel Gün', color: '#A142F4' },
  { key: 'other', label: 'Diğer', color: '#9E9E9E' },
];

// Mini Calendar Component
function MiniCalendar({ selectedDate, onSelect, month, setMonth }) {
  const start = startOfWeek(new Date(month.getFullYear(), month.getMonth(), 1), { weekStartsOn: 1 });
  const days = [];
  let d = start;
  for (let i = 0; i < 42; i++) {
    days.push(new Date(d));
    d = new Date(d);
    d.setDate(d.getDate() + 1);
  }
  return (
    <div className="mini-calendar">
      <div className="mini-calendar-header">
        <button onClick={() => setMonth(subMonths(month, 1))}>{'<'}</button>
        <span>{format(month, 'MMMM yyyy')}</span>
        <button onClick={() => setMonth(addMonths(month, 1))}>{'>'}</button>
      </div>
      <div className="mini-calendar-weekdays">
        {[...Array(7)].map((_,i)=>(<div key={i}>{['P','S','Ç','P','C','C','P'][i]}</div>))}
      </div>
      <div className="mini-calendar-days">
        {days.map((day, i) => (
          <div
            key={i}
            className={`mini-calendar-day${isSameDay(day, selectedDate) ? ' selected' : ''}${!isSameMonth(day, month) ? ' other' : ''}`}
            onClick={() => onSelect(day)}
          >
            {day.getDate()}
          </div>
        ))}
      </div>
    </div>
  );
}

const initialEvents = [
  {
    title: 'Ders Çalışma',
    start: new Date(),
    end: new Date(new Date().getTime() + 60*60*1000),
    allDay: false,
    category: 'school',
    desc: '',
  },
];

const LOCAL_STORAGE_KEY = 'calendarEvents';

const CalendarPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [miniMonth, setMiniMonth] = useState(new Date());
  const [modal, setModal] = useState({ open: false, mode: 'add', eventIdx: null, start: null, end: null });
  const [eventForm, setEventForm] = useState({ title: '', desc: '', start: '', end: '', category: 'work' });
  const [menuOpen, setMenuOpen] = useState(false);
  const userId = 1; // Örnek kullanıcı id'si

  // Fetch events from backend
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get('/api/Events');
        const formattedEvents = response.data.map(event => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end)
        }));
        setEvents(formattedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();
  }, []);

  // Haftalık görünüm için haftanın ilk günü
  const getWeekStart = (date) => startOfWeek(date, { weekStartsOn: 1 });

  // Haftayı ileri/geri al
  const handleWeekNav = (dir) => {
    setSelectedDate(dir === 1 ? addWeeks(selectedDate, 1) : subWeeks(selectedDate, 1));
  };

  // Etkinlik ekleme için modal aç
  const handleSelectSlot = ({ start, end }) => {
    setModal({ open: true, mode: 'add', eventIdx: null, start, end });
    setEventForm({
      title: '',
      desc: '',
      start: format(start, "yyyy-MM-dd'T'HH:mm"),
      end: format(end, "yyyy-MM-dd'T'HH:mm"),
      category: 'work',
    });
  };

  // Etkinlik düzenleme için modal aç
  const handleSelectEvent = (event) => {
    const idx = events.indexOf(event);
    setModal({ open: true, mode: 'edit', eventIdx: idx, start: event.start, end: event.end });
    setEventForm({
      title: event.title,
      desc: event.desc || '',
      start: format(event.start, "yyyy-MM-dd'T'HH:mm"),
      end: format(event.end, "yyyy-MM-dd'T'HH:mm"),
      category: event.category || 'work',
    });
  };

  // Modalda etkinlik ekle
  const handleAddEvent = async () => {
    if (!eventForm.title.trim()) {
      alert('Lütfen bir başlık girin');
      return;
    }

    const newEvent = {
      title: eventForm.title.trim(),
      start: new Date(eventForm.start).toISOString(),
      end: new Date(eventForm.end).toISOString(),
      description: eventForm.desc || '',
      category: eventForm.category,
      userId: userId
    };

    try {
      const response = await api.post('/api/Events', newEvent);
      const formattedEvent = {
        ...response.data,
        start: new Date(response.data.start),
        end: new Date(response.data.end)
      };
      setEvents([...events, formattedEvent]);
      setModal({ open: false, mode: 'add', eventIdx: null, start: null, end: null });
    } catch (error) {
      alert(JSON.stringify(error.response?.data, null, 2));
      console.error('Error adding event:', error);
    }
  };

  // Modalda etkinlik güncelle
  const handleUpdateEvent = async () => {
    if (modal.eventIdx == null) return;

    const updatedEvent = {
      ...events[modal.eventIdx],
      title: eventForm.title,
      desc: eventForm.desc,
      start: new Date(eventForm.start),
      end: new Date(eventForm.end),
      category: eventForm.category
    };

    try {
      await api.put(`/api/Events/${updatedEvent.id}`, updatedEvent);
      const updated = [...events];
      updated[modal.eventIdx] = updatedEvent;
      setEvents(updated);
      setModal({ open: false, mode: 'add', eventIdx: null, start: null, end: null });
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  // Modalda etkinlik sil
  const handleDeleteEvent = async () => {
    if (modal.eventIdx == null) return;

    const eventToDelete = events[modal.eventIdx];

    try {
      await api.delete(`/api/Events/${eventToDelete.id}`);
      setEvents(events.filter((_, i) => i !== modal.eventIdx));
      setModal({ open: false, mode: 'add', eventIdx: null, start: null, end: null });
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  // Mini takvimden gün seçilince ana takvimi o haftaya getir
  const handleMiniSelect = (date) => {
    setSelectedDate(date);
  };

  // Etkinlik rengi
  const eventPropGetter = (event) => {
    const category = CATEGORIES.find(c => c.key === event.category);
    return {
      style: {
        backgroundColor: category ? category.color : '#9E9E9E',
        color: '#fff',
        borderRadius: '8px',
        border: 'none',
        fontWeight: 600,
        fontSize: '1rem',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      },
    };
  };

  return (
    <div className="calendar-bg">
      <UniversalMenu />
      <div className="calendar-flex-layout">
        <div className="calendar-main-area">
          <div className="calendar-toolbar-custom">
            <button onClick={() => handleWeekNav(-1)}>&lt;</button>
            <span>{format(getWeekStart(selectedDate), 'd MMM yyyy')} - {format(addWeeks(getWeekStart(selectedDate), 1), 'd MMM yyyy')}</span>
            <button onClick={() => handleWeekNav(1)}>&gt;</button>
          </div>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            defaultView={Views.WEEK}
            view={Views.WEEK}
            date={selectedDate}
            onNavigate={date => setSelectedDate(date)}
            style={{ height: '90vh', width: '100%', background: 'rgba(255,255,255,0.97)', borderRadius: 18, padding: 16, boxShadow: '0 8px 32px 0 rgba(30,41,59,0.13)' }}
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            popup
            toolbar={false}
            messages={{
              today: 'Bugün',
              previous: 'Geri',
              next: 'İleri',
              month: 'Ay',
              week: 'Hafta',
              day: 'Gün',
              agenda: 'Ajanda',
              date: 'Tarih',
              time: 'Saat',
              event: 'Etkinlik',
              noEventsInRange: 'Bu aralıkta etkinlik yok.'
            }}
            min={new Date(selectedDate.setHours(6,0,0,0))}
            max={new Date(selectedDate.setHours(23,59,59,999))}
            eventPropGetter={eventPropGetter}
          />
        </div>
        <div className="calendar-sidebar">
          <MiniCalendar selectedDate={selectedDate} onSelect={handleMiniSelect} month={miniMonth} setMonth={setMiniMonth} />
        </div>
      </div>
      {/* Modal */}
      {modal.open && (
        <div className="calendar-modal-overlay" onClick={()=>setModal({ open: false, mode: 'add', eventIdx: null, start: null, end: null })}>
          <div className="calendar-modal" onClick={e=>e.stopPropagation()}>
            <h2>{modal.mode === 'edit' ? 'Etkinliği Düzenle' : 'Yeni Etkinlik'}</h2>
            <input
              type="text"
              placeholder="Başlık"
              value={eventForm.title}
              onChange={e=>setEventForm(ev=>({...ev, title: e.target.value}))}
              autoFocus
            />
            <div className="calendar-modal-row">
              <label>Başlangıç</label>
              <input
                type="datetime-local"
                value={eventForm.start}
                onChange={e=>setEventForm(ev=>({...ev, start: e.target.value}))}
              />
            </div>
            <div className="calendar-modal-row">
              <label>Bitiş</label>
              <input
                type="datetime-local"
                value={eventForm.end}
                onChange={e=>setEventForm(ev=>({...ev, end: e.target.value}))}
              />
            </div>
            <textarea
              placeholder="Açıklama (isteğe bağlı)"
              value={eventForm.desc}
              onChange={e=>setEventForm(ev=>({...ev, desc: e.target.value}))}
            />
            <div className="calendar-modal-row">
              <label>Kategori</label>
              <div className="calendar-category-list">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.key}
                    type="button"
                    className={`calendar-category-btn${eventForm.category === cat.key ? ' selected' : ''}`}
                    style={{ background: cat.color, opacity: eventForm.category === cat.key ? 1 : 0.5 }}
                    onClick={()=>setEventForm(ev=>({...ev, category: cat.key}))}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="calendar-modal-actions">
              <button onClick={()=>setModal({ open: false, mode: 'add', eventIdx: null, start: null, end: null })}>İptal</button>
              {modal.mode === 'edit' && <button className="delete" onClick={handleDeleteEvent}>Sil</button>}
              {modal.mode === 'edit' ? (
                <button className="add" onClick={handleUpdateEvent}>Kaydet</button>
              ) : (
                <button className="add" onClick={handleAddEvent}>Ekle</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage; 