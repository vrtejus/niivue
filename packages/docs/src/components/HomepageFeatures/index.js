import clsx from 'clsx';
import Heading from '@theme/Heading';
import NiivueCanvas from '../NiivueCanvas';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Works everywhere',
    description: (
      <>
        NiiVue is a JavaScript library that can be used in any modern web
        environment: Safari, Firefox, Chrome, Edge, Electron, iOS, Android.
      </>
    ),
  },
  {
    title: 'Simple API',
    description: (
      <>
        NiiVue is designed to be easy to use and is platform and framework agnostic.
      </>
    ),
  },
  {
    title: 'Community',
    description: (
      <>
        The community has made <a style={{textDecoration: 'underline'}} href='https://github.com/niivue/niivue?tab=readme-ov-file#projects-and-people-using-niivue' target='_blank' rel='noopener noreferrer'>extensions, products, and plug-ins</a> using NiiVue. 
      </>
    ),
  },
];

function Feature({ Svg, title, description }) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
        <NiivueCanvas
          images={[
            { url: "/niivue/mni152.nii.gz" }
          ]}
          nvOpts={{
            // option to set the initial scene when the viewer is loaded
          }}
        >
        </NiivueCanvas>
      </div>
    </section>
  );
}
