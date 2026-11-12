const AcademicCalendar=(()=>{
 const terms=[{name:'Fall 2026',start:'2026-08-24',end:'2026-12-08',examsStart:'2026-12-09',examsEnd:'2026-12-17'},{name:'Spring 2027',start:'2027-01-11',end:'2027-05-05',examsStart:'2027-05-06',examsEnd:'2027-05-14'},{name:'Summer 2027',start:'2027-05-31',end:'2027-07-02',examsStart:'2027-07-05',examsEnd:'2027-07-07'}];
 const holidays=[{name:'National Day',start:'2026-12-02',end:'2026-12-03'},{name:'Winter break',start:'2026-12-21',end:'2027-01-03'},{name:'Eid Al Fitr · provisional',start:'2027-03-09',end:'2027-03-11'},{name:'Spring break',start:'2027-04-05',end:'2027-04-09'},{name:'Eid Al Adha · provisional',start:'2027-05-17',end:'2027-05-19'}];
 const milestones=[{date:'2026-08-27',name:'Add/drop deadline'},{date:'2026-10-30',name:'Last day to withdraw with W'},{date:'2026-11-16',name:'Spring early registration begins'},{date:'2027-01-14',name:'Add/drop deadline'},{date:'2027-03-26',name:'Last day to withdraw with W'},{date:'2027-04-19',name:'Fall early registration begins'},{date:'2027-06-02',name:'Add/drop deadline'},{date:'2027-06-25',name:'Last day to withdraw with W'},{date:'2027-08-23',name:'Expected Fall 2027 classes begin'}];
 const termFor=date=>terms.find(t=>date>=t.start&&date<=t.end)||null;
 const holiday=date=>holidays.find(h=>date>=h.start&&date<=h.end)||null;
 const exam=date=>terms.find(t=>date>=t.examsStart&&date<=t.examsEnd)||null;
 const labels=date=>[holiday(date)?.name,exam(date)?'Final exams':null,...milestones.filter(m=>m.date===date).map(m=>m.name)].filter(Boolean);
 function classAllowed(event,date){const term=termFor(event.date);return (!term||date<=term.end)&&!holiday(date);}
 return {terms,holidays,milestones,termFor,holiday,exam,labels,classAllowed};
})();
if(typeof module!=='undefined')module.exports=AcademicCalendar;
