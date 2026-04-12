import { useState, useEffect } from 'react';
import { Joyride, type EventData, type Controls, STATUS, ACTIONS } from 'react-joyride';
import { useCompleteTutorial } from '@/services/auth';
import { USER_TUTORIAL_STEPS, ADMIN_TUTORIAL_STEPS } from './steps';

interface TutorialProps {
  mode: 'user' | 'admin';
  hasSeenTutorial: boolean;
  isAdmin: boolean;
}

const Tutorial = ({ mode, hasSeenTutorial, isAdmin }: TutorialProps) => {
  const [runTour, setRunTour] = useState(false);
  const [tourMode, setTourMode] = useState<'user' | 'admin' | null>(null);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(false);
  const completeTutorialMutation = useCompleteTutorial();

  useEffect(() => {
    if (hasSeenTutorial || runTour || hasCompletedTutorial) {
      return;
    }

    if (mode === 'user') {
      setTourMode('user');
      setRunTour(true);
    } else if (mode === 'admin' && isAdmin) {
      setTourMode('admin');
      setRunTour(true);
    }
  }, [mode, hasSeenTutorial, isAdmin]);

  const handleJoyrideEvent = (data: EventData, _controls: Controls) => {
    const { status, action } = data;

    if (action === ACTIONS.SKIP || action === ACTIONS.CLOSE) {
      setRunTour(false);
      setHasCompletedTutorial(true);
      completeTutorialMutation.mutate();
      return;
    }

    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(status)) {
      setRunTour(false);

      if (isAdmin && tourMode === 'user' && status === STATUS.FINISHED) {
        setTimeout(() => {
          setTourMode('admin');
          setRunTour(true);
        }, 1000);
      } else {
        setHasCompletedTutorial(true);
        completeTutorialMutation.mutate();
      }
    }
  };

  const steps = tourMode === 'admin' ? ADMIN_TUTORIAL_STEPS : USER_TUTORIAL_STEPS;

  return (
    <Joyride
      steps={steps}
      run={runTour}
      continuous
      onEvent={handleJoyrideEvent}
      options={{
        primaryColor: 'var(--color-primary)',
        zIndex: 10000,
        showProgress: true,
        buttons: ['back', 'close', 'primary', 'skip'],
      }}
      styles={{
        tooltip: {
          borderRadius: '8px',
          fontSize: '14px',
        },
        buttonSkip: {
          color: 'var(--color-grey)',
        },
        beaconInner: {
          backgroundColor: 'var(--color-secondary)',
        },
        beaconOuter: {
          backgroundColor: 'rgba(28, 68, 227, 0.3)',
          border: '2px solid var(--color-secondary)',
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  );
};

export default Tutorial;
