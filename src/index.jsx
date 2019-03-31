import React from 'react';
import Quagga from 'quagga';
import PropTypes from 'prop-types';

const defaultId = '__process_div';
const defaultOption = {
  frequency: 5,
  numOfWorkers: window.navigator.hardwareConcurrency || 4,
  name: 'Live',
  type: 'LiveStream',
  readers: ['ean_reader']
};

const isMediaSupported =
  window.navigator.mediaDevices &&
  typeof window.navigator.mediaDevices.getUserMedia === 'function';

const getResponse = ({
  codeResult: { code: result, direction, format },
  angle,
  pattern
}) => ({
  result,
  meta: {
    angle,
    direction,
    format,
    pattern
  }
});

class Component extends React.Component {
  constructor() {
    super();
    this.mounted = true;
    this.state = {
      loading: true,
      power: false,
      initialized: false,
      error: null
    };

    this.initializeQuagga = this.initializeQuagga.bind(this);
  }

  componentDidMount() {
    const { onDetected, type } = this.props;

    if (isMediaSupported) {
      if (type === 'barcode') {
        this.initializeQuagga((err) => {
          if (this.mounted) {
            if (err) {
              this.setState({
                loading: false,
                error: err
              });
            } else {
              Quagga.start();
              this.setState({
                loading: false,
                power: true,
                initialized: true
              });
            }
          }
        });

        Quagga.onProcessed(() => {
          Quagga.canvas.dom.overlay.style.display = 'none';
        });

        if (typeof onDetected === 'function') {
          Quagga.onDetected((data) => onDetected(getResponse(data)));
        } else if (this.mounted) {
          this.setState({
            loading: false,
            error: new Error('onDetected() is not a valid function')
          });
        }
      } else if (this.mounted) {
        this.setState({
          loading: false,
          error: new Error('No valid scan type is specified')
        });
      }
    } else if (this.mounted) {
      this.setState({
        loading: false,
        error: new Error("Your browser doesn't support media")
      });
    }
  }

  componentDidUpdate() {
    this.onUpdate();
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  onUpdate() {
    if (this.mounted) {
      const { power, initialized, error } = this.state;
      const { status, onError } = this.props;

      if (error) {
        onError(error);
      } else if (initialized) {
        if (power !== status) {
          if (status === true) {
            this.initializeQuagga((err) => {
              if (this.mounted) {
                if (err) {
                  this.setState({
                    loading: false,
                    error: err
                  });
                } else {
                  Quagga.start();
                  this.setState({
                    loading: false,
                    power: true,
                    initialized: true
                  });
                }
              }
            });
          } else {
            Quagga.stop();
            this.setState({
              loading: true,
              power: false,
              error: null
            });
          }
        }
      }
    }
  }

  initializeQuagga(callback) {
    const { id, width, height, deviceId, option } = this.props;
    const opts = {
      ...defaultOption,
      ...option
    };
    const config = {
      numOfWorkers: opts.numOfWorkers,
      locate: true,
      inputStream: {
        name: opts.name,
        type: opts.type,
        target: document.querySelector(`#${id}`),
        constraints: {
          width,
          height,
          facingMode: !deviceId && 'environment',
          deviceId
        },
        locator: {
          debug: {
            showCanvas: false
          }
        }
      },
      frequency: opts.frequency,
      decoder: {
        readers: opts.readers,
        multiple: false
      }
    };

    Quagga.init(config, callback);
  }

  render() {
    const { loading } = this.state;
    const { id, className, style } = this.props;

    return (
      <div className={className} style={style}>
        {loading && <p style={{ textAlign: 'center' }}>Loading...</p>}
        <div id={id} style={{ display: loading && 'none' }} />
      </div>
    );
  }
}

Component.propTypes = {
  id: PropTypes.string,
  type: PropTypes.oneOf(['barcode', 'qrcode']),
  status: PropTypes.bool.isRequired,
  height: PropTypes.number,
  width: PropTypes.number,
  deviceId: PropTypes.string,
  style: PropTypes.object,
  className: PropTypes.string,
  option: PropTypes.shape({
    frequency: PropTypes.number,
    numOfWorkers: PropTypes.number,
    name: PropTypes.string,
    type: PropTypes.oneOf(['ImageStream', 'VideoStream', 'LiveStream']),
    readers: PropTypes.arrayOf(
      PropTypes.oneOf([
        '2of5_reader',
        'codabar_reader',
        'code_39_reader',
        'code_39_vin_reader',
        'code_93_reader',
        'code_128_reader',
        'ean_reader',
        'ean_2_reader',
        'ean_5_reader',
        'ean_8_reader',
        'ean_13_reader',
        'i2of5_reader',
        'upc_reader',
        'upc_e_reader'
      ])
    )
  }),
  onDetected: PropTypes.func.isRequired,
  onError: PropTypes.func
};

Component.defaultProps = {
  id: defaultId,
  type: 'barcode',
  height: 480,
  width: 640,
  deviceId: undefined,
  style: undefined,
  className: undefined,
  option: defaultOption,
  onError: (err) => console.error(err)
};

export default Component;
