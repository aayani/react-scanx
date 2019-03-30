import React from 'react';
import Quagga from 'quagga';
import PropTypes from 'prop-types';

const isMediaSupported = window.navigator.mediaDevices && typeof window.navigator.mediaDevices.getUserMedia === 'function';

const getResponse = data => ({
  result: data.codeResult.code,
  meta: {
    angle: data.angle,
    direction: data.codeResult.direction,
    format: data.codeResult.format,
    pattern: data.pattern,
  },
});

class Component extends React.Component {
  constructor(props) {
    super(props);

    const {
      onDetected, name, type, readers, numOfWorkers, frequency,
    } = this.props;
    this.onDetected = onDetected;
    this.name = name;
    this.type = type;
    this.readers = readers;
    this.numOfWorkers = numOfWorkers;
    this.frequency = frequency;
  }

  componentDidMount() {
    const {
      width, height, facingMode, deviceId, onError,
    } = this.props;

    if (!this.initialized && isMediaSupported) {
      this.initialized = true;
      Quagga.init(
        {
          numOfWorkers: this.numOfWorkers,
          locate: true,
          inputStream: {
            name: this.name,
            type: this.type,
            target: document.querySelector('#__process_div'),
            constraints: {
              width,
              height,
              facingMode,
              deviceId,
            },
            locator: {
              debug: {
                showCanvas: false,
              },
            },
          },
          frequency: this.frequency,
          decoder: {
            readers: this.readers,
          },
        },
        (err) => {
          this.camInitialized = true;
          if (err) {
            onError(err);
          } else {
            Quagga.start();
          }
        },
      );

      Quagga.onProcessed(() => {
        Quagga.canvas.dom.overlay.style.display = 'none';
      });

      if (typeof onDetected === 'function') {
        Quagga.onDetected((data) => {
          this.onDetected(getResponse(data));
          Quagga.stop();
        });
      } else {
        onError(new Error('onDetected() is not a valid function'));
      }
    }
  }

  render() {
    const { onError, className, style } = this.props;

    if (!isMediaSupported) {
      onError(new Error("Your browser doesn't support media"));
      return null;
    }

    return (
      <div className={className} style={style}>
        <div id="__process_div" />
      </div>
    );
  }
}

Component.propTypes = {
  frequency: PropTypes.number,
  numOfWorkers: PropTypes.number,
  name: PropTypes.string,
  type: PropTypes.string,
  readers: PropTypes.arrayOf(PropTypes.string),
  onDetected: PropTypes.func.isRequired,
  onError: PropTypes.func,
  height: PropTypes.number,
  width: PropTypes.number,
  facingMode: PropTypes.string,
  deviceId: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
};

Component.defaultProps = {
  frequency: 10,
  numOfWorkers: 4,
  name: 'Live',
  type: 'LiveStream',
  readers: ['ean_reader'],
  onError: (err) => {
    console.error(err);
  },
  height: 480,
  width: 640,
  facingMode: 'environment',
  deviceId: undefined,
  className: undefined,
  style: undefined,
};

export default Component;
