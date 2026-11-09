import {describe,expect,it} from 'vitest';
import {accessStatus,accessSummary} from './AccessManagement';

describe('access management labels',()=>{
 it('summarizes workspace members by role and approval state',()=>{
  expect(accessSummary([
   {role:'master',approved:true,status:'approved'},
   {role:'member',approved:true,status:'approved'},
   {role:'member',approved:false,status:'pending'},
  ])).toEqual({members:2,master:1,pending:1});
 });

 it('provides a stable status label for each profile state',()=>{
  expect(accessStatus({role:'master'})).toEqual({label:'Master account',tone:'master'});
  expect(accessStatus({role:'member',approved:true})).toEqual({label:'Accepted',tone:'accepted'});
  expect(accessStatus({role:'member',status:'rejected'})).toEqual({label:'Rejected',tone:'rejected'});
  expect(accessStatus({role:'member',approved:false})).toEqual({label:'Pending approval',tone:'pending'});
 });
});
