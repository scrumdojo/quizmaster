package cz.scrumdojo.quizmaster.workspace;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import cz.scrumdojo.quizmaster.TestFixtures;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
public class WorkspaceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TestFixtures fixtures;

    @Test
    public void saveAndGetWorkspace() throws Exception {
        var result = mockMvc
            .perform(
                post("/api/workspaces")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {"title": "Test Workspace"}
                        """
                    )
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.guid").isNotEmpty())
            .andReturn();

        String guid = com.jayway.jsonpath.JsonPath.read(result.getResponse().getContentAsString(), "$.guid");

        mockMvc
            .perform(get("/api/workspaces/{guid}", guid))
            .andExpect(status().isOk())
            .andExpect(
                content().json(
                    """
                    {"guid": "%s", "title": "Test Workspace"}
                    """.formatted(guid)
                )
            );
    }

    @Test
    public void listWorkspacesIncludesCreatedWorkspace() throws Exception {
        var result = mockMvc
            .perform(
                post("/api/workspaces")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {"title": "Listed Workspace"}
                        """
                    )
            )
            .andExpect(status().isOk())
            .andReturn();

        String guid = com.jayway.jsonpath.JsonPath.read(result.getResponse().getContentAsString(), "$.guid");
        fixtures.save(fixtures.question().workspaceGuid(guid));

        mockMvc
            .perform(get("/api/workspaces"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[?(@.guid == '%s')].title".formatted(guid)).value("Listed Workspace"));
    }

    @Test
    public void listWorkspacesFiltersByCreatedAtRange() throws Exception {
        var result = mockMvc
            .perform(
                post("/api/workspaces")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {"title": "Range Workspace"}
                        """
                    )
            )
            .andExpect(status().isOk())
            .andReturn();

        String guid = com.jayway.jsonpath.JsonPath.read(result.getResponse().getContentAsString(), "$.guid");
        fixtures.save(fixtures.question().workspaceGuid(guid));

        mockMvc
            .perform(get("/api/workspaces").param("from", LocalDate.now().plusDays(1).toString()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[?(@.guid == '%s')]".formatted(guid)).isEmpty());

        mockMvc
            .perform(
                get("/api/workspaces")
                    .param("from", LocalDate.now().toString())
                    .param("to", LocalDate.now().plusDays(1).toString())
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[?(@.guid == '%s')].title".formatted(guid)).value("Range Workspace"));
    }

    @Test
    public void listWorkspacesFiltersByTitleQuery() throws Exception {
        var workspace = fixtures.save(fixtures.workspace().title("Astronomy Basics"));
        fixtures.save(fixtures.questionIn(workspace));

        mockMvc
            .perform(get("/api/workspaces").param("query", "astro"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[?(@.guid == '%s')].title".formatted(workspace.getGuid())).value("Astronomy Basics"));

        mockMvc
            .perform(get("/api/workspaces").param("query", "geography"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[?(@.guid == '%s')]".formatted(workspace.getGuid())).isEmpty());
    }

    @Test
    public void listWorkspacesExcludesEmptyWorkspaces() throws Exception {
        var filledWorkspace = fixtures.save(fixtures.workspace().title("Filled Workspace"));
        fixtures.save(fixtures.questionIn(filledWorkspace));
        var emptyWorkspace = fixtures.save(fixtures.workspace().title("Empty Workspace"));

        mockMvc
            .perform(get("/api/workspaces"))
            .andExpect(status().isOk())
            .andExpect(
                jsonPath("$[?(@.guid == '%s')].title".formatted(filledWorkspace.getGuid())).value("Filled Workspace")
            )
            .andExpect(jsonPath("$[?(@.guid == '%s')]".formatted(emptyWorkspace.getGuid())).isEmpty());
    }

    @Test
    public void saveWorkspaceBlankTitleReturnsBadRequest() throws Exception {
        mockMvc
            .perform(
                post("/api/workspaces")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {"title": "  "}
                        """
                    )
            )
            .andExpect(status().isBadRequest());
    }

    @Test
    public void saveWorkspaceNullTitleReturnsBadRequest() throws Exception {
        mockMvc
            .perform(post("/api/workspaces").contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    public void getWorkspaceNotFound() throws Exception {
        mockMvc.perform(get("/api/workspaces/{guid}", "non-existent-guid")).andExpect(status().isNotFound());
    }
}
