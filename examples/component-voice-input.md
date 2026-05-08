<!-- hand-written -->
# `VoiceInput` (custom — push-to-talk + transcript voice input) — spec

> Voice input button + listening state UI for chat interfaces, voice search, voice commands. Wraps Web Speech API (or platform STT) with visual feedback, transcript preview, error handling, and Korean voice conventions. Pairs with [`knowledge/conversational/voice-ui-patterns.md`](../knowledge/conversational/voice-ui-patterns.md).

## Purpose

Voice input in apps requires:
1. **Visible button** to start / stop listening.
2. **Listening visual feedback** (waveform, pulse).
3. **Transcript preview** (real-time as user speaks).
4. **Error states** (mic permission denied, no speech detected, network).
5. **Cancel** path (back, slide off).
6. **Korean STT integration** (Clova, Web Speech, Whisper).
7. **Reduced-motion respect**.
8. **Accessibility alt** for non-voice users.

`VoiceInput` provides this as a standardized component.

## Anatomy

### Idle state

```
┌─────┐
│ 🎤  │   ← mic button (44pt minimum)
└─────┘
```

### Listening state (modal or inline)

```
┌──────────────────────────────────┐
│        ●●●●●●●●●●                │   ← waveform / pulse
│     "배송 언제 와요?"              │   ← transcript preview
│                                  │
│        [×] Cancel       [✓] Send │
└──────────────────────────────────┘
```

### Processing (after stop)

```
┌──────────────────────────────────┐
│       처리 중...                  │   ← spinner
└──────────────────────────────────┘
```

## API

```tsx
<VoiceInput
  onTranscript={(text, isFinal) => handle(text, isFinal)}
  onCancel={handleCancel}
  language="ko-KR"
  variant="modal"             // "inline" | "modal" | "button-only"
  maxDuration={30000}         // ms; auto-stop
  autoStop                    // stop on silence
  silenceTimeout={1500}       // ms of silence before auto-stop
  showTranscript
  pushToTalk={false}          // hold to talk vs tap-to-toggle
  size="md"
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `onTranscript` | `(text: string, isFinal: boolean) => void` | — | Called with interim + final transcript |
| `onCancel` | `() => void` | — | User cancels |
| `onError` | `(error) => void` | — | STT or permission errors |
| `language` | `string` | `"ko-KR"` | BCP-47 language tag |
| `variant` | `"inline" \| "modal" \| "button-only"` | `"button-only"` | Layout |
| `maxDuration` | `number` | `30000` | Auto-stop after this many ms |
| `autoStop` | `boolean` | `true` | Stop on silence |
| `silenceTimeout` | `number` | `1500` | Ms of silence before auto-stop |
| `showTranscript` | `boolean` | `true` | Show interim transcript |
| `pushToTalk` | `boolean` | `false` | Hold (true) vs tap-to-toggle (false) |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Button size |
| `provider` | `"web-speech" \| "clova" \| "whisper" \| "custom"` | `"web-speech"` | STT backend |
| `disabled` | `boolean` | `false` | Disable button |

## Variants

### `button-only`

Just the mic button. When tapped, opens whatever modal/inline UI is appropriate (configured externally).

### `inline`

Mic button expands inline to listening UI within parent layout. Used in chat input bars.

### `modal`

Full-screen / centered modal during listening. Used for voice search, primary voice features.

## States

| State | Visual | Behavior |
| --- | --- | --- |
| `idle` | Mic icon, default | Tap / hold to start |
| `requesting-permission` | Spinner | Browser permission prompt |
| `listening` | Animated waveform + transcript | Capturing audio |
| `processing` | Spinner | STT processing final transcript |
| `error-permission` | "Mic access required" + Settings link | User denied mic |
| `error-no-speech` | "Didn't catch that. Try again?" | Silent recording |
| `error-network` | "Network error. Try again." | STT failed |
| `disabled` | Grayed out | When `disabled` prop |

## Tokens consumed

```
--voice-input-button-bg
--voice-input-button-fg
--voice-input-button-bg-active   (during listening)
--voice-input-button-bg-error
--voice-input-waveform-color     (brand color typically)
--voice-input-waveform-bg
--voice-input-transcript-fg
--voice-input-modal-bg           (full-screen overlay if modal)
--motion-fast, --motion-medium
--ease-out
--space-md, --space-lg
--radius-full                    (mic button is circular)
```

## Visual feedback

### Pulse animation (listening)

```css
.voice-input__button[data-state="listening"] {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 var(--voice-input-button-bg-active); }
  50%      { transform: scale(1.05); box-shadow: 0 0 0 8px transparent; }
}

@media (prefers-reduced-motion: reduce) {
  .voice-input__button[data-state="listening"] { animation: none; }
}
```

### Waveform

Visualize audio level real-time:

```tsx
function Waveform({ analyser }: { analyser: AnalyserNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const bufferLength = analyser.frequencyBinCount;
    const data = new Uint8Array(bufferLength);

    let rafId: number;
    const draw = () => {
      analyser.getByteFrequencyData(data);
      // ...render bars
      rafId = requestAnimationFrame(draw);
    };
    draw();

    return () => cancelAnimationFrame(rafId);
  }, [analyser]);

  return <canvas ref={canvasRef} aria-hidden="true" />;
}
```

For reduced motion: replace with simple "Listening..." text.

## Interaction patterns

### Tap-to-toggle (default)

1. User taps mic.
2. Listening starts.
3. User speaks.
4. User taps again to stop OR auto-stops on silence.
5. Transcript sent.

### Push-to-talk (PTT)

1. User holds mic button.
2. Listening starts immediately.
3. User releases when done.
4. Transcript sent.

PTT is preferred for:
- Walkie-talkie UX.
- Short utterances.
- Public spaces (no risk of accidental long recording).

Tap-to-toggle preferred for:
- Long-form input (dictation).
- Mobile (holding finger is tedious).

## Implementation

### Web Speech API (browser-native)

```tsx
function VoiceInput({ onTranscript, language = "ko-KR", autoStop = true, silenceTimeout = 1500, ... }: Props) {
  const recognitionRef = useRef<SpeechRecognition>();
  const [state, setState] = useState<"idle" | "listening" | "processing" | "error">("idle");
  const [transcript, setTranscript] = useState("");
  const reduced = usePrefersReducedMotion();

  const start = async () => {
    try {
      // Permission check (modern API)
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setState("error");
      onError?.({ type: "permission" });
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onError?.({ type: "unsupported" });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = true;
    recognition.continuous = autoStop ? false : true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) final += result[0].transcript;
        else interim += result[0].transcript;
      }
      const combined = final + interim;
      setTranscript(combined);
      onTranscript(combined, !!final);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setState("error");
      onError?.({ type: event.error });
    };

    recognition.onend = () => {
      setState("idle");
    };

    recognition.start();
    recognitionRef.current = recognition;
    setState("listening");
  };

  const stop = () => {
    recognitionRef.current?.stop();
    setState("processing");
  };

  return (
    <button
      className="voice-input__button"
      data-state={state}
      data-reduced={reduced}
      onClick={state === "idle" ? start : stop}
      aria-label={state === "idle" ? "음성으로 입력" : "녹음 중지"}
      aria-pressed={state === "listening"}
    >
      {state === "idle" && <MicIcon />}
      {state === "listening" && <StopIcon />}
      {state === "processing" && <Spinner />}
      {state === "error" && <ErrorIcon />}
    </button>
  );
}
```

### For Clova / Whisper / custom backend

Replace Web Speech with custom STT. Stream microphone audio (MediaRecorder) to backend; receive transcript via WebSocket or chunks.

```tsx
// Pseudocode
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const recorder = new MediaRecorder(stream);
recorder.ondataavailable = e => sendChunkToServer(e.data);
recorder.start(250); // emit every 250ms
```

For Korean: Naver Clova STT API recommended for best Korean recognition; OpenAI Whisper API also strong.

## Permission handling

First-time user must grant mic permission:

```
┌────────────────────────────────────┐
│ 음성 입력을 사용하려면 마이크 권한이│
│ 필요해요.                          │
│                                    │
│  [권한 요청]                        │
└────────────────────────────────────┘
```

If denied:
```
┌────────────────────────────────────┐
│ 마이크 권한이 차단되어 있어요.       │
│ 브라우저 설정에서 권한을 허용해 주세요.│
│                                    │
│  [브라우저 설정 열기]                │
└────────────────────────────────────┘
```

## Error handling

| Error | UX |
| --- | --- |
| Permission denied | Modal with "Enable in settings" |
| No speech detected | "Didn't catch that. Try again?" with replay option |
| Network error (cloud STT) | "Connection error. Retry." |
| Browser unsupported | Hide voice button OR show "Use text input" hint |
| Timeout (no speech for N seconds) | Auto-stop with "Tap to try again" |
| STT confidence too low | "Not sure I caught that. Did you mean: [option1] [option2]?" |

## Accessibility

- **Visual indicator** of listening state (waveform / pulse).
- **Transcript visible** to deaf users (so they see what's captured).
- **Text alt input** always available (don't make voice the only path).
- **ARIA labels**: button has descriptive label.
- **`aria-live`** for transcript updates.
- **Reduced motion**: pulse / waveform replaced with static "Listening..." text.
- **High contrast**: button has visible border, not just color.
- **Keyboard activation**: Space / Enter triggers start/stop.

## Korean conventions

| Aspect | Default |
| --- | --- |
| Button label | "음성으로 입력" |
| Listening state | "듣고 있어요..." |
| Processing | "처리 중..." |
| No speech | "음성을 인식하지 못했어요. 다시 시도해 주세요." |
| Permission needed | "마이크 권한이 필요해요" |
| Cancel button | "취소" |
| Send button | "전송" |

For Korean STT: configure language as `ko-KR`. Web Speech API works for Korean in Chrome / Edge; Naver Clova preferred for production-grade.

## Mobile considerations

- Touch target minimum 44pt.
- iOS Safari requires user gesture to start mic.
- Background tab paused; resume on focus.
- Battery drain — auto-stop on silence is critical.
- Bluetooth mic compatibility — test.

## Performance

- Don't keep mic open when not needed (release stream on stop).
- For waveform: use `requestAnimationFrame`, not `setInterval`.
- Stream audio in chunks (don't accumulate full recording in memory).
- For long-form: chunked upload to STT (250ms chunks typical).

## Edge cases

- **User taps mic while listening**: stops (toggle behavior).
- **User leaves page mid-recording**: cleanup; release mic.
- **Multiple mics on system**: use default; can add device picker.
- **External mic disconnects**: graceful fallback to internal.
- **Long pauses mid-utterance**: don't auto-stop too eagerly (user thinking).
- **STT mishears brand name**: provide post-edit option.
- **Korean dialect** (Busan, Jeju): test; Whisper handles best.
- **Code-switching** (Korean + English): STT may misrecognize; large LLMs handle better.

## Don't

- Don't auto-record without explicit start gesture.
- Don't keep mic open after stop.
- Don't omit visual feedback. Listening must be visually obvious.
- Don't make voice the only input path.
- Don't ignore reduced-motion users.
- Don't auto-stop in 200ms if user pauses to think.
- Don't ship without permission denial UX.
- Don't ignore Korean STT specifics (language tag, dialect).

## References

Built on:
- Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`)
- Naver Clova Speech API (Korean cloud STT)
- OpenAI Whisper API (cloud STT, multilingual)
- React patterns for permission handling

## Cross-reference

- [`knowledge/conversational/voice-ui-patterns.md`](../knowledge/conversational/voice-ui-patterns.md) — voice patterns
- [`knowledge/conversational/conversational-ui-fundamentals.md`](../knowledge/conversational/conversational-ui-fundamentals.md) — fundamentals
- [`knowledge/conversational/korean-voice-conventions.md`](../knowledge/conversational/korean-voice-conventions.md) — KR
- [`examples/component-chat-interface.md`](component-chat-interface.md) — chat UI consumer
- [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md) — keyboard
