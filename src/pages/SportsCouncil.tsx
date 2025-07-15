import React from 'react';
import Layout from '@/components/Layout';
import { SportsCouncilMeetings } from '@/components/sports-council';

/**
 * Sports Council Page
 * Public page displaying sports council meetings and minutes
 */
const SportsCouncil = () => {
  return (
    <Layout>
      <SportsCouncilMeetings />
    </Layout>
  );
};

export default SportsCouncil;