import { useState } from 'react';
import { Joyride, type Step, type EventData, type Status, STATUS } from 'react-joyride';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageTourProps {
  steps: Step[];
  pageName: string;
}

const PageTour = ({ steps, pageName }: PageTourProps) => {
  const [runTour, setRunTour] = useState(false);

  const handleStartTour = () => {
    setRunTour(true);
  };

  const handleJoyrideEvent = (data: EventData) => {
    const { status } = data;
    const finishedStatuses: Status[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRunTour(false);
    }
  };

  return (
    <>
      <Joyride
        steps={steps}
        run={runTour}
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
          skip: 'Skip',
        }}
      />

      <Button
        onClick={handleStartTour}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50"
        variant="default"
        size="icon"
        aria-label={`Start ${pageName} tutorial`}
      >
        <HelpCircle style={{ width: '21px', height: '21px' }} />
      </Button>
    </>
  );
};

export default PageTour;
