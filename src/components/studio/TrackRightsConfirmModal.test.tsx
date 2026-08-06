import { fireEvent, render, screen } from '@testing-library/react-native';

import { TrackRightsConfirmModal } from '@/components/studio/TrackRightsConfirmModal';

describe('TrackRightsConfirmModal', () => {
  it('désactive Publier tant que la case n’est pas cochée', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    render(
      <TrackRightsConfirmModal
        visible
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    fireEvent.press(screen.getByLabelText('Publier le titre'));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('autorise la publication après acceptation', () => {
    const onConfirm = jest.fn();

    render(
      <TrackRightsConfirmModal
        visible
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />,
    );

    fireEvent.press(
      screen.getByLabelText('Je suis l’auteur ou je détiens tous les droits'),
    );
    fireEvent.press(screen.getByLabelText('Publier le titre'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('annule sans publier', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    render(
      <TrackRightsConfirmModal
        visible
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    fireEvent.press(screen.getByLabelText('Annuler'));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
