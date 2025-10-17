import './RainbowStripes.css';

const RainbowStripes = ({ position = 'top', variant = 'default' }) => {
  return (
    <div className={`rainbow-stripes rainbow-stripes-${position} rainbow-stripes-${variant}`}>
      <div className="rainbow-stripe"></div>
    </div>
  );
};

export default RainbowStripes;
