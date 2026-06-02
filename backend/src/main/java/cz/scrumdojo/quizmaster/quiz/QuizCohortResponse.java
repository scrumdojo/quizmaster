package cz.scrumdojo.quizmaster.quiz;

public record QuizCohortResponse(String guid, String name, boolean canDelete) {
    public static QuizCohortResponse from(Cohort cohort, boolean canDelete) {
        return new QuizCohortResponse(cohort.getGuid(), cohort.getName(), canDelete);
    }
}
