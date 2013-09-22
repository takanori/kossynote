use ExtUtils::MakeMaker;

WriteMakefile(
    NAME          => 'KossyNote',
    VERSION_FROM  => 'lib/KossyNote.pm',
    PREREQ_PM     => {
        'Kossy' =>  '0.19',
    },
    MIN_PERL_VERSION => '5.008001'
);

