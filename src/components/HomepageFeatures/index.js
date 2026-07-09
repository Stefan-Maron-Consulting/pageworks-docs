import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'In-tenant rendering',
    description: (
      <>
        PDF output is rendered entirely inside your Business Central
        environment — no external service, no document content leaving the
        tenant.
      </>
    ),
  },
  {
    title: 'Deterministic output',
    description: (
      <>
        The same report and data produce byte-identical PDF output, every
        time, in every environment — no timestamps, no random IDs, no
        environment drift.
      </>
    ),
  },
  {
    title: 'Text-first templates',
    description: (
      <>
        Layouts are plain, well-formed <code>.pageworks.html</code> files —
        diff-friendly, reviewable in pull requests, and easy for both people
        and AI agents to author.
      </>
    ),
  },
];

function Feature({title, description}) {
  return (
    <div className={clsx('col col--4')}>
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
      </div>
    </section>
  );
}
