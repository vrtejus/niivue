import clsx from 'clsx';
import Heading from '@theme/Heading';
import NiivueCanvas from '../NiivueCanvas';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Runs everywhere',
    description: (
      <>
        NiiVue is a JavaScript library that can be used in any modern web
        environment.
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
    // Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        The community has made extensions, products, and plug-ins using NiiVue. 
      </>
    ),
  },
];

function Feature({ Svg, title, description }) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        {/* <Svg className={styles.featureSvg} role="img" /> */}
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
