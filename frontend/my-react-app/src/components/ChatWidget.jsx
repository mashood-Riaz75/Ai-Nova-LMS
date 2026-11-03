import { useEffect, useRef, useState } from 'react';
import API from '../service/Api';
import './ChatWidget.css';

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: 'Hi! I can help with your assessments or profile.',
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [draft, setDraft] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const messageListRef = useRef(null);

  useEffect(() => {
    if (isOpen && messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [isOpen, loading, messages]);

  const sendMessage = async (event) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message || loading) return;

    setMessages((current) => [...current, { role: 'user', content: message }]);
    setDraft('');
    setLoading(true);

    try {
      const response = await API.post('/chat/', {
        message,
        ...(sessionId ? { session_id: sessionId } : {}),
      });
      setSessionId(response.data.session_id);
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: response.data.reply },
      ]);
    } catch (error) {
      const errorMessage = error.response?.status === 429
        ? 'You’ve reached the chat limit. Please wait a minute and try again.'
        : 'Sorry, I could not send that message. Please try again.';
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: errorMessage, isError: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage(event);
    }
  };

  return (
    <div className="chat-widget">
      {isOpen && (
        <section
          className="chat-panel"
          id="student-chat-panel"
          role="dialog"
          aria-labelledby="chat-panel-title"
        >
          <header className="chat-panel-header">
            <div>
              <h2 id="chat-panel-title">Student support</h2>
              <p>Assessments and profile help</p>
            </div>
            <button
              type="button"
              className="chat-close-button"
              onClick={() => setIsOpen(false)}
              aria-label="Close student support chat"
            >
              ×
            </button>
          </header>

          <div
            className="chat-message-list"
            ref={messageListRef}
            aria-live="polite"
            aria-relevant="additions text"
            aria-label="Chat messages"
          >
            {messages.map((item, index) => (
              <div
                className={`chat-message chat-message-${item.role}${item.isError ? ' chat-message-error' : ''}`}
                key={`${item.role}-${index}`}
              >
                {item.content}
              </div>
            ))}
            {loading && (
              <div className="chat-message chat-message-assistant" role="status">
                Thinking…
              </div>
            )}
          </div>

          <form className="chat-composer" onSubmit={sendMessage}>
            <label className="chat-sr-only" htmlFor="student-chat-message">
              Your message
            </label>
            <textarea
              id="student-chat-message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your assessments or profile…"
              maxLength={1000}
              rows={2}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !draft.trim()}
            >
              Send
            </button>
            <span className="chat-sr-only">Press Enter to send. Shift plus Enter for a new line.</span>
          </form>
        </section>
      )}

      <button
        type="button"
        className="chat-toggle-button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls="student-chat-panel"
        aria-label={isOpen ? 'Close student support chat' : 'Open student support chat'}
      >
        {isOpen ? 'Close chat' : 'Chat with support'}
      </button>
    </div>
  );
}
