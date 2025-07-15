import React from 'react';
import Layout from '@/components/Layout';
import { YouthVolunteerRoles as YouthVolunteerRolesComponent } from '@/components/youth';

/**
 * Youth Volunteer Roles Page
 * Public page displaying a curated list of volunteer roles for young people
 */
const YouthVolunteerRoles = () => {
  return (
    <Layout>
      <YouthVolunteerRolesComponent />
    </Layout>
  );
};

export default YouthVolunteerRoles;
