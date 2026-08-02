import { fireEvent, render, screen } from '@testing-library/react-native';

import { StarRating } from '@/components/ratings/StarRating';

describe('StarRating', () => {
  it('appelle onChange avec la valeur tapée', () => {
    const onChange = jest.fn();
    render(<StarRating value={2} onChange={onChange} />);

    fireEvent.press(screen.getByLabelText('4 étoiles'));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('mode lecture : pas de boutons interactifs', () => {
    render(<StarRating value={3} accessibilityLabel="Moyenne 3" />);
    expect(screen.getByLabelText('Moyenne 3')).toBeTruthy();
    expect(screen.queryByLabelText('4 étoiles')).toBeNull();
  });
});
