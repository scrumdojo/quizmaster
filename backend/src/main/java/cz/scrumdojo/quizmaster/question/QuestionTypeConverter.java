package cz.scrumdojo.quizmaster.question;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class QuestionTypeConverter implements AttributeConverter<QuestionType, String> {

    @Override
    public String convertToDatabaseColumn(QuestionType attribute) {
        return attribute == null ? null : attribute.wire();
    }

    @Override
    public QuestionType convertToEntityAttribute(String dbData) {
        return dbData == null ? null : QuestionType.fromWire(dbData);
    }
}
